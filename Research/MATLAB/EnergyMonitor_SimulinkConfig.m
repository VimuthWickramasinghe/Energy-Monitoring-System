%% =========================================================
%  SIMULINK MODEL CONFIGURATION & REFERENCE DOCUMENT  (v2.0)
%  Architecture: Single-Phase Input → Scott-T (1φ→3φ) Transformer → 3φ Loads
%
%  This file documents all block parameters, connections, and
%  design decisions for manual setup or reference.
%
%  To BUILD the model automatically: run EnergyMonitor_Simulink.m
%  To RUN the MATLAB simulation:     run EnergyMonitor_Main.m
%% =========================================================

%{
╔══════════════════════════════════════════════════════════════════════╗
║  MODEL: EnergyMonitor_ThreePhase                                     ║
║  Simulation Time: 0.1 s (5 cycles at 50 Hz)                         ║
║  Solver: ode45,  MaxStep = 1e-5 s                                    ║
╚══════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM ARCHITECTURE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌──────────────┐     ┌───────────────────────┐     ┌─────────────────────┐
  │  SINGLE-PHASE│     │   SCOTT-T TRANSFORMER  │     │  THREE-PHASE LOADS  │
  │  SUPPLY      │────▶│   (1φ → 3φ)            │────▶│  (Resistive Bulbs)  │
  │  230V, 50Hz  │     │   η = 97%              │     │  A:50W B:75W C:100W │
  └──────────────┘     └───────────────────────┘     └─────────────────────┘
        │                       │                            │
   [V1Ph_Input]        [XFmr_Out_A/B/C]           [Load_A/B/C]
   Sine Wave            Gain + Phase Shift         Gain (1/R)
   (reference 0°)       A:0° B:-120° C:+120°


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 0: SINGLE-PHASE INPUT SOURCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Sine Wave] V1Ph_Input
  Amplitude   : 325.27 V   (= 230 * sqrt(2))
  Frequency   : 314.16 rad/s  (= 2*pi*50)
  Phase       : 0 rad        (reference)
  SampleTime  : 0 (continuous)

  → This represents the single-phase utility supply entering the
    primary winding of the Scott-T transformer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 1: SCOTT-T TRANSFORMER (1φ → 3φ CONVERSION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Theory:
  The Scott-T connection uses TWO single-phase transformers:
    1. MAIN transformer   — provides the in-phase (0°) component
    2. TEASER transformer — provides a 90° quadrature component

  From these two orthogonal outputs, a mathematically balanced
  three-phase set is synthesized:

    V_A =  η · V_in                          [0°]
    V_B = -η/2 · V_in - η√3/2 · V_in_90°   [-120°]
    V_C = -η/2 · V_in + η√3/2 · V_in_90°   [+120°]

  where V_in_90° is V_in delayed by T/4 = 1/(4·50) = 5 ms

Simulink Implementation:
─────────────────────────────────────────────────
[Transport Delay]  Teaser_90deg
  DelayTime : 1/(4*freq) = 0.005 s   ← 90° phase shift

[Gain]  XFmr_Out_A
  Gain : eta_xfmr = 0.97
  Input: V1Ph_Input
  Output: Phase A voltage (0°)

[Gain]  XFmr_B_main
  Gain : -eta_xfmr/2 = -0.485
  Input: V1Ph_Input

[Gain]  XFmr_B_teas
  Gain : -eta_xfmr*sqrt(3)/2 = -0.839
  Input: Teaser_90deg (90° shifted)

[Sum]   XFmr_Out_B  (inputs: ++)
  In1  : XFmr_B_main
  In2  : XFmr_B_teas
  Output: Phase B voltage (-120°)

[Gain]  XFmr_C_main
  Gain : -eta_xfmr/2 = -0.485
  Input: V1Ph_Input

[Gain]  XFmr_C_teas
  Gain : +eta_xfmr*sqrt(3)/2 = +0.839
  Input: Teaser_90deg (90° shifted)

[Sum]   XFmr_Out_C  (inputs: ++)
  In1  : XFmr_C_main
  In2  : XFmr_C_teas
  Output: Phase C voltage (+120°)

Resulting Output (η = 0.97):
  Vrms_3ph (L-N) = 230 × 0.97 = 223.1 V rms
  Vpeak_3ph      = 223.1 × √2 = 315.5 V peak
  Vrms_LL (L-L)  = 223.1 × √3 = 386.4 V rms  (≈ 400V nominal)
  Phase sequence : A(0°) → B(-120°) → C(+120°)
  Balance check  : V_A + V_B + V_C = 0 at all instants ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 2: SENSOR MODULES (Three-Phase Secondary Side)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Three sensor subsystems, one per secondary phase output:
  Sensor_1_PhaseA  |  Sensor_2_PhaseB  |  Sensor_3_PhaseC

Each sensor subsystem internal structure:
  [Gain]        V_Sensor       : Gain = 1   (voltage measurement / PT sim)
  [Gain]        Z_magnitude    : Gain = sqrt(R^2 + XL^2)
  [Divide]      I_calc         : V_in / Z_magnitude
  [Gain]        I_Sensor       : Gain = 1   (current measurement / CT sim)
  [Constant]    Phase_Angle    : = atan(XL/R) [rad]
  [Trig Func]   PF_cos         : cos(theta) → Power Factor
  [Trig Func]   Q_sin          : sin(theta) → Reactive power
  [Product x3]  Active_Power   : V × I × cos(θ)
  [Product x3]  Reactive_Power : V × I × sin(θ)
  [Product x2]  Apparent_Power : V × I

Sensor 1 — Phase A (50W load):
  R1    = 223.1² / 50  = 996.2 Ω
  Z1    = √(996.2² + 2²) ≈ 996.20 Ω
  θ1    = atan(2/996.2) ≈ 0.00201 rad = 0.115°
  PF1   = cos(θ1) ≈ 0.999998
  Irms1 = 223.1 / 996.2 ≈ 0.2239 A
  P1    ≈ 49.97 W

Sensor 2 — Phase B (75W load):
  R2    = 223.1² / 75  = 664.1 Ω
  Z2    ≈ 664.10 Ω
  θ2    = atan(2/664.1) ≈ 0.00301 rad = 0.173°
  PF2   ≈ 0.999996
  Irms2 = 223.1 / 664.1 ≈ 0.3359 A
  P2    ≈ 74.96 W

Sensor 3 — Phase C (100W load):
  R3    = 223.1² / 100 = 498.1 Ω
  Z3    ≈ 498.10 Ω
  θ3    = atan(2/498.1) ≈ 0.00401 rad = 0.230°
  PF3   ≈ 0.999992
  Irms3 = 223.1 / 498.1 ≈ 0.4479 A
  P3    ≈ 99.94 W

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 3: THREE-PHASE LOADS (Resistive Bulbs)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Gain] Load_A_50W
  Gain   : 1/R1  (converts secondary voltage → phase A current)
  Rating : 50W resistive bulb

[Gain] Load_B_75W
  Gain   : 1/R2
  Rating : 75W resistive bulb

[Gain] Load_C_100W
  Gain   : 1/R3
  Rating : 100W resistive bulb

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LAYER 4: MONITORING BLOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Scope]   Input_Monitor     : Single-phase input waveform
[Mux(3) → Scope] Voltage_Monitor  : V_A, V_B, V_C waveforms
[Mux(3) → Scope] Current_Monitor  : I_A, I_B, I_C waveforms
[Display] P_Display_A/B/C  : Active power per phase (W)
[Display] PF_Display_A/B/C : Power factor per phase

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETE SIGNAL ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

V1Ph_Input → Teaser_90deg (90° delay)
V1Ph_Input → XFmr_Out_A   (η gain → Phase A)
V1Ph_Input → XFmr_B_main  (-η/2 gain)
V1Ph_Input → XFmr_C_main  (-η/2 gain)

Teaser_90deg → XFmr_B_teas  (-η√3/2 → sum with B_main → Phase B)
Teaser_90deg → XFmr_C_teas  (+η√3/2 → sum with C_main → Phase C)

XFmr_Out_A → Sensor_1_PhaseA → [measurements]
XFmr_Out_B → Sensor_2_PhaseB → [measurements]
XFmr_Out_C → Sensor_3_PhaseC → [measurements]

XFmr_Out_A → Load_A_50W  → I_Mux/1 → Current_Monitor
XFmr_Out_B → Load_B_75W  → I_Mux/2
XFmr_Out_C → Load_C_100W → I_Mux/3

XFmr_Out_A → V_Mux/1 → Voltage_Monitor
XFmr_Out_B → V_Mux/2
XFmr_Out_C → V_Mux/3

V1Ph_Input → Input_Monitor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCALABILITY MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODE 1 (Current): SINGLE-PHASE INPUT → 3φ TRANSFORMER → 3φ LOADS
  → Scott-T or Steinmetz transformer
  → One V1Ph_Input source, three balanced output phases
  → Used for: industrial sites with only 1φ supply available

MODE 2: THREE-PHASE DIRECT INPUT (original)
  → Three separate Sine Wave sources (VA, VB, VC)
  → No transformer layer needed
  → Used for: sites with native 3φ grid connection

MODE 3: MULTI-CIRCUIT (independent 1φ circuits)
  → Multiple V1Ph_Input sources, each with own transformer
  → Individual loads monitored independently
  → Used for: campus / building metering across circuits

%}

fprintf('This is a reference/documentation file.\n');
fprintf('Run EnergyMonitor_Main.m      for MATLAB simulation.\n');
fprintf('Run EnergyMonitor_Simulink.m  to build the Simulink model.\n');

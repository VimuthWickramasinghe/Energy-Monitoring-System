%% =========================================================
%  ENERGY MONITOR — FIX LOG  (v2.1 → v3.0)
%  File: EnergyMonitor_Simulink.m
%% =========================================================
%
%  ┌─────────────────────────────────────────────────────────┐
%  │  BUG 1 — Constant block workspace-expression errors     │
%  ├─────────────────────────────────────────────────────────┤
%  │ ORIGINAL (broken):                                      │
%  │   'Value', sprintf('(Vrms_3ph^2/sqrt(%s^2+XL^2))*...' │
%  │                                                         │
%  │ Simulink evaluates the 'Value' string in the model      │
%  │ workspace at compile time. The model workspace had R1,  │
%  │ R2, R3, XL as numeric scalars — it did NOT have a      │
%  │ variable named 'R1' that could resolve in an expression │
%  │ like 'Vrms_3ph^2/sqrt(R1^2+XL^2)'. This caused        │
%  │ "Undefined variable" simulation errors.                 │
%  │                                                         │
%  │ FIX: Pre-compute all numeric values in MATLAB before    │
%  │ building the model, then use num2str() to embed the     │
%  │ final numeric string directly into each block's Value   │
%  │ parameter. No workspace-expression needed.              │
%  └─────────────────────────────────────────────────────────┘
%
%  ┌─────────────────────────────────────────────────────────┐
%  │  BUG 2 — Block position overlaps (model looks messy)   │
%  ├─────────────────────────────────────────────────────────┤
%  │ ORIGINAL:                                               │
%  │   XFmr_Out_A  at [300, 70,  360, 100]                  │
%  │   V_Mux       at [740, 70,  750, 165]  ← same y-band   │
%  │   Load_A_50W  at [480, 70,  550, 100]  ← same y-band   │
%  │   Vsense_A    at [620, 85,  680, 110]  ← same y-band   │
%  │   Disp blocks at y=620-700 overlap sensor row C        │
%  │                                                         │
%  │ FIX: Encapsulate every layer in a subsystem. Each       │
%  │ subsystem has its own internal coordinate space, so     │
%  │ there is zero cross-layer overlap. The root canvas      │
%  │ shows only 5 clean subsystem boxes in a row.            │
%  └─────────────────────────────────────────────────────────┘
%
%  ┌─────────────────────────────────────────────────────────┐
%  │  BUG 3 — Duplicate add_line port-conflict errors        │
%  ├─────────────────────────────────────────────────────────┤
%  │ ORIGINAL:                                               │
%  │   Layer 2: add_line 'XFmr_Out_A/1' → 'Load_A_50W/1'  │
%  │   Layer 3: add_line 'XFmr_Out_A/1' → 'Vsense_A/1'    │
%  │   Layer 4: add_line 'XFmr_Out_A/1' → 'V_Mux/1'       │
%  │   Layer 4: add_line 'Load_A_50W/1' → 'I_Mux/1'       │
%  │   Layer 3: add_line 'Load_A_50W/1' → 'Isense_A/1'    │
%  │                                                         │
%  │ Simulink's add_line can branch a signal (one output to  │
%  │ multiple inputs) but only if each destination is added  │
%  │ sequentially from the SAME source handle. Mixing        │
%  │ source/destination order across code sections causes    │
%  │ "port already connected" errors on certain MATLAB       │
%  │ versions.                                               │
%  │                                                         │
%  │ FIX: With subsystems, each layer's internal lines are   │
%  │ entirely self-contained. Cross-layer signals travel via │
%  │ Outport→Inport. Only ONE add_line per root-level        │
%  │ connection — no duplicates possible.                    │
%  └─────────────────────────────────────────────────────────┘
%
%  ┌─────────────────────────────────────────────────────────┐
%  │  BUG 4 — Sensor outputs were static Constants           │
%  ├─────────────────────────────────────────────────────────┤
%  │ ORIGINAL:                                               │
%  │   Constant block for P = "(Vrms_3ph^2/...)" — static   │
%  │   This does not reflect actual simulated V and I;       │
%  │   scope would show a flat line regardless of transformer│
%  │   output variation.                                     │
%  │                                                         │
%  │ FIX: Each SS_Sensor now uses Product blocks:            │
%  │   P = V_sense × I_sense × cos(θ)                       │
%  │   Q = V_sense × I_sense × sin(θ)                       │
%  │   S = V_sense × I_sense                                 │
%  │ These are live signals computed from the actual         │
%  │ transformer/load waveforms during simulation.           │
%  │ (PF remains a constant — it is load-determined.)        │
%  └─────────────────────────────────────────────────────────┘
%
%  ┌─────────────────────────────────────────────────────────┐
%  │  IMPROVEMENT — No subsystems (flat model)               │
%  ├─────────────────────────────────────────────────────────┤
%  │ ORIGINAL: ~50 blocks scattered in the root canvas with  │
%  │ crossing wires and no visual grouping.                  │
%  │                                                         │
%  │ FIX: Five clean subsystems on the root canvas:          │
%  │  [SS_Input] → [SS_Transformer] → [SS_Loads]            │
%  │                    → [SS_Sensor_A] → [SS_Monitor]       │
%  │                    → [SS_Sensor_B]                      │
%  │                    → [SS_Sensor_C]                      │
%  │                                                         │
%  │ Double-click any box to inspect internals.              │
%  └─────────────────────────────────────────────────────────┘
%
%  FILES STATUS
%  ────────────
%  EnergyMonitor_Main.m          ✓ No bugs — runs correctly standalone
%  EnergyMonitor_SimulinkConfig.m ✓ Documentation only — no changes needed
%  EnergyMonitor_Simulink.m      ✗ Fixed → v3.0 (see above)
%  EnergyMonitor_ThreePhase.slx  (regenerated by running fixed .m file)

fprintf('This is the fix log / documentation file.\n');
fprintf('Run EnergyMonitor_Simulink.m (v3.0) to build the corrected model.\n');
fprintf('Run EnergyMonitor_Main.m     to run the standalone MATLAB simulation.\n');

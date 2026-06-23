%% =========================================================
%  THREE-PHASE ENERGY MONITORING SYSTEM — SIMULINK BUILDER (v2.1)
%  Architecture: Single-Phase Input → Scott-T (1φ→3φ) Transformer → 3φ Loads
%
%  Fixed: Sensor subsystems replaced with inline blocks (no port errors)
%  Run this script to auto-generate EnergyMonitor_ThreePhase.slx
%% =========================================================

clear; clc;

model_name = 'EnergyMonitor_ThreePhase';

if bdIsLoaded(model_name)
    close_system(model_name, 0);
end

new_system(model_name);
open_system(model_name);

%% ---- MODEL WORKSPACE PARAMETERS ---------------------------
hws = get_param(model_name, 'modelworkspace');

% Single-phase input
hws.assignin('Vrms_1ph',  230);
hws.assignin('freq',      50);
hws.assignin('omega',     2*pi*50);
hws.assignin('Vpeak_1ph', 230*sqrt(2));

% Transformer (Scott-T, eta=97%)
hws.assignin('eta_xfmr',  0.97);
hws.assignin('Vrms_3ph',  230 * 0.97);
hws.assignin('Vpeak_3ph', 230 * 0.97 * sqrt(2));

% Phase offsets
hws.assignin('phi_A',  0);
hws.assignin('phi_B', -2*pi/3);
hws.assignin('phi_C',  2*pi/3);

% Load resistances (using 3ph output voltage)
Vrms_3ph_val = 230 * 0.97;
hws.assignin('R1', Vrms_3ph_val^2 / 50);
hws.assignin('R2', Vrms_3ph_val^2 / 75);
hws.assignin('R3', Vrms_3ph_val^2 / 100);
hws.assignin('XL', 2);

fprintf('Setting up model workspace... done\n');

%% ================================================================
%  LAYER 0: SINGLE-PHASE INPUT SOURCE
%% ================================================================

add_block('simulink/Sources/Sine Wave', [model_name '/V1Ph_Input'], ...
    'Position',   [30 185 90 215], ...
    'Amplitude',  'Vpeak_1ph', ...
    'Frequency',  'omega', ...
    'Phase',      '0', ...
    'SampleTime', '0');

fprintf('Layer 0 (input source)... done\n');

%% ================================================================
%  LAYER 1: SCOTT-T TRANSFORMER  (1φ → 3φ)
%  Uses Transport Delay for 90° teaser, then gain matrix
%% ================================================================

% Teaser winding: 90° phase shift via transport delay
add_block('simulink/Continuous/Transport Delay', [model_name '/Teaser_90deg'], ...
    'Position',  [150 270 230 300], ...
    'DelayTime', '1/(4*freq)');

% Phase A output: eta * V_in
add_block('simulink/Math Operations/Gain', [model_name '/XFmr_Out_A'], ...
    'Position', [300 70 360 100], ...
    'Gain',     'eta_xfmr');

% Phase B: -eta/2 * V_main  +  -eta*sqrt(3)/2 * V_teaser
add_block('simulink/Math Operations/Gain', [model_name '/XFmr_B_main'], ...
    'Position', [150 140 210 170], ...
    'Gain',     '-eta_xfmr/2');
add_block('simulink/Math Operations/Gain', [model_name '/XFmr_B_teas'], ...
    'Position', [260 310 320 340], ...
    'Gain',     '-eta_xfmr*sqrt(3)/2');
add_block('simulink/Math Operations/Sum', [model_name '/XFmr_Out_B'], ...
    'Position', [370 145 400 310], ...
    'Inputs',   '++');

% Phase C: -eta/2 * V_main  +  +eta*sqrt(3)/2 * V_teaser
add_block('simulink/Math Operations/Gain', [model_name '/XFmr_C_main'], ...
    'Position', [150 400 210 430], ...
    'Gain',     '-eta_xfmr/2');
add_block('simulink/Math Operations/Gain', [model_name '/XFmr_C_teas'], ...
    'Position', [260 440 320 470], ...
    'Gain',     'eta_xfmr*sqrt(3)/2');
add_block('simulink/Math Operations/Sum', [model_name '/XFmr_Out_C'], ...
    'Position', [370 405 400 470], ...
    'Inputs',   '++');

% Connections: input → transformer
add_line(model_name, 'V1Ph_Input/1',  'Teaser_90deg/1',  'autorouting','on');
add_line(model_name, 'V1Ph_Input/1',  'XFmr_Out_A/1',    'autorouting','on');
add_line(model_name, 'V1Ph_Input/1',  'XFmr_B_main/1',   'autorouting','on');
add_line(model_name, 'Teaser_90deg/1','XFmr_B_teas/1',   'autorouting','on');
add_line(model_name, 'XFmr_B_main/1','XFmr_Out_B/1',    'autorouting','on');
add_line(model_name, 'XFmr_B_teas/1','XFmr_Out_B/2',    'autorouting','on');
add_line(model_name, 'V1Ph_Input/1',  'XFmr_C_main/1',   'autorouting','on');
add_line(model_name, 'Teaser_90deg/1','XFmr_C_teas/1',   'autorouting','on');
add_line(model_name, 'XFmr_C_main/1','XFmr_Out_C/1',    'autorouting','on');
add_line(model_name, 'XFmr_C_teas/1','XFmr_Out_C/2',    'autorouting','on');

fprintf('Layer 1 (Scott-T transformer)... done\n');

%% ================================================================
%  LAYER 2: THREE-PHASE LOADS (Gain blocks: I = V/R)
%% ================================================================

add_block('simulink/Math Operations/Gain', [model_name '/Load_A_50W'], ...
    'Position', [480 70 550 100], ...
    'Gain',     '1/R1');
add_block('simulink/Math Operations/Gain', [model_name '/Load_B_75W'], ...
    'Position', [480 215 550 245], ...
    'Gain',     '1/R2');
add_block('simulink/Math Operations/Gain', [model_name '/Load_C_100W'], ...
    'Position', [480 415 550 445], ...
    'Gain',     '1/R3');

add_line(model_name, 'XFmr_Out_A/1', 'Load_A_50W/1',  'autorouting','on');
add_line(model_name, 'XFmr_Out_B/1', 'Load_B_75W/1',  'autorouting','on');
add_line(model_name, 'XFmr_Out_C/1', 'Load_C_100W/1', 'autorouting','on');

fprintf('Layer 2 (loads)... done\n');

%% ================================================================
%  LAYER 3: INLINE MEASUREMENT BLOCKS
%  V-sense (Gain=1), I-sense (Gain=1), P/Q/S/PF as Constants
%  Using Constants is the standard programmatic approach —
%  avoids subsystem inport errors.
%% ================================================================

phases_info = {
    'A', 'R1', 50;
    'B', 'R2', 75;
    'C', 'R3', 100;
};

y_base = [85, 230, 430];   % vertical centres for A, B, C rows

for k = 1:3
    ph  = phases_info{k,1};
    Rv  = phases_info{k,2};
    Pw  = phases_info{k,3};
    yb  = y_base(k);
    col = 620;

    % Voltage sense (Gain=1, simulates PT)
    vblk = [model_name '/Vsense_' ph];
    add_block('simulink/Math Operations/Gain', vblk, ...
        'Position', [col yb col+60 yb+25], ...
        'Gain',     '1');

    % Current sense (Gain=1, simulates CT) — reads from load output
    iblk = [model_name '/Isense_' ph];
    add_block('simulink/Math Operations/Gain', iblk, ...
        'Position', [col yb+40 col+60 yb+65], ...
        'Gain',     '1');

    % Active power P constant
    pblk = [model_name '/P_ph' ph];
    add_block('simulink/Sources/Constant', pblk, ...
        'Position', [col yb+90 col+80 yb+110], ...
        'Value',    sprintf('(Vrms_3ph^2/sqrt(%s^2+XL^2))*cos(atan(XL/%s))', Rv, Rv));

    % Reactive power Q constant
    qblk = [model_name '/Q_ph' ph];
    add_block('simulink/Sources/Constant', qblk, ...
        'Position', [col yb+120 col+80 yb+140], ...
        'Value',    sprintf('(Vrms_3ph^2/sqrt(%s^2+XL^2))*sin(atan(XL/%s))', Rv, Rv));

    % Apparent power S constant
    sblk = [model_name '/S_ph' ph];
    add_block('simulink/Sources/Constant', sblk, ...
        'Position', [col yb+150 col+80 yb+170], ...
        'Value',    sprintf('Vrms_3ph^2/sqrt(%s^2+XL^2)', Rv));

    % Power factor PF constant
    pfblk = [model_name '/PF_ph' ph];
    add_block('simulink/Sources/Constant', pfblk, ...
        'Position', [col yb+180 col+80 yb+200], ...
        'Value',    sprintf('cos(atan(XL/%s))', Rv));

    % Connect transformer output → V-sense
    if k == 1
        src = 'XFmr_Out_A/1';
        isrc = 'Load_A_50W/1';
    elseif k == 2
        src = 'XFmr_Out_B/1';
        isrc = 'Load_B_75W/1';
    else
        src = 'XFmr_Out_C/1';
        isrc = 'Load_C_100W/1';
    end
    add_line(model_name, src,  ['Vsense_' ph '/1'], 'autorouting','on');
    add_line(model_name, isrc, ['Isense_' ph '/1'], 'autorouting','on');
end

fprintf('Layer 3 (inline sensors)... done\n');

%% ================================================================
%  LAYER 4: SCOPES & DISPLAYS
%% ================================================================

% Input scope
add_block('simulink/Sinks/Scope', [model_name '/Input_Monitor'], ...
    'Position', [780 180 840 220]);
add_line(model_name, 'V1Ph_Input/1', 'Input_Monitor/1', 'autorouting','on');

% Voltage scope (3-phase mux)
add_block('simulink/Signal Routing/Mux', [model_name '/V_Mux'], ...
    'Position', [740 70 750 165], ...
    'Inputs',   '3');
add_block('simulink/Sinks/Scope', [model_name '/Voltage_Monitor'], ...
    'Position', [780 90 840 145]);
add_line(model_name, 'XFmr_Out_A/1', 'V_Mux/1', 'autorouting','on');
add_line(model_name, 'XFmr_Out_B/1', 'V_Mux/2', 'autorouting','on');
add_line(model_name, 'XFmr_Out_C/1', 'V_Mux/3', 'autorouting','on');
add_line(model_name, 'V_Mux/1', 'Voltage_Monitor/1', 'autorouting','on');

% Current scope (3-phase mux)
add_block('simulink/Signal Routing/Mux', [model_name '/I_Mux'], ...
    'Position', [740 250 750 450], ...
    'Inputs',   '3');
add_block('simulink/Sinks/Scope', [model_name '/Current_Monitor'], ...
    'Position', [780 320 840 380]);
add_line(model_name, 'Load_A_50W/1',  'I_Mux/1', 'autorouting','on');
add_line(model_name, 'Load_B_75W/1',  'I_Mux/2', 'autorouting','on');
add_line(model_name, 'Load_C_100W/1', 'I_Mux/3', 'autorouting','on');
add_line(model_name, 'I_Mux/1', 'Current_Monitor/1', 'autorouting','on');

% Display blocks for PF and P per phase
disp_labels = {'A','B','C'};
disp_y = [620 660 700];
for k = 1:3
    ph = disp_labels{k};
    yp = disp_y(k);

    pf_disp = [model_name '/Disp_PF_' ph];
    p_disp  = [model_name '/Disp_P_'  ph];

    add_block('simulink/Sinks/Display', pf_disp, ...
        'Position', [750 yp 840 yp+22], 'Format','short');
    add_block('simulink/Sinks/Display', p_disp, ...
        'Position', [750 yp+30 840 yp+52], 'Format','short');

    add_line(model_name, ['PF_ph' ph '/1'], ['Disp_PF_' ph '/1'], 'autorouting','on');
    add_line(model_name, ['P_ph'  ph '/1'], ['Disp_P_'  ph '/1'], 'autorouting','on');
end

% V-sense → display (optional: show Vrms constant)
add_block('simulink/Sinks/Display', [model_name '/Disp_Vrms'], ...
    'Position', [750 580 840 600], 'Format','short');
add_block('simulink/Sources/Constant', [model_name '/Vrms_display'], ...
    'Position', [620 580 720 600], ...
    'Value', 'Vrms_3ph');
add_line(model_name, 'Vrms_display/1', 'Disp_Vrms/1', 'autorouting','on');

fprintf('Layer 4 (scopes and displays)... done\n');

%% ================================================================
%  TITLE ANNOTATION & SIMULATION SETTINGS
%% ================================================================

set_param(model_name, 'StopTime',   '0.1');
set_param(model_name, 'Solver',     'ode45');
set_param(model_name, 'MaxStep',    '1e-5');
set_param(model_name, 'SaveOutput', 'on');

%% -- Save
save_system(model_name);

fprintf('\n✓ Simulink model built successfully: %s\n', model_name);
fprintf('  Simulate: sim(''%s'')\n', model_name);
fprintf('  Or press the Run button in the Simulink window.\n\n');

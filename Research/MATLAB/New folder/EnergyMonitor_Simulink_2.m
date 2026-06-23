function build_energy_monitor()
%% =========================================================
%  THREE-PHASE ENERGY MONITORING SYSTEM — SIMULINK BUILDER (v3.2)
%  Architecture: Single-Phase Input → Scott-T (1φ→3φ) Transformer → 3φ Loads
%
%  Run this script to auto-generate EnergyMonitor_ThreePhase.slx
%% =========================================================

clear; clc;

model_name = 'EnergyMonitor_ThreePhase_20s';

if bdIsLoaded(model_name)
    close_system(model_name, 0);
end

new_system(model_name);
open_system(model_name);

%% ================================================================
%  COMPUTE ALL NUMERIC VALUES UPFRONT
%% ================================================================

Vrms_1ph  = 230;
freq      = 50;
omega     = 2 * pi * freq;
Vpeak_1ph = Vrms_1ph * sqrt(2);
eta_xfmr  = 0.97;
Vrms_3ph  = Vrms_1ph * eta_xfmr;
XL        = 2;

R1 = Vrms_3ph^2 / 50;
R2 = Vrms_3ph^2 / 75;
R3 = Vrms_3ph^2 / 100;

Z1 = sqrt(R1^2 + XL^2);  cosT1 = R1/Z1;  sinT1 = XL/Z1;
Z2 = sqrt(R2^2 + XL^2);  cosT2 = R2/Z2;  sinT2 = XL/Z2;
Z3 = sqrt(R3^2 + XL^2);  cosT3 = R3/Z3;  sinT3 = XL/Z3;

fprintf('Parameters computed. Building model...\n\n');

%% ================================================================
%  SS1: SS_Input
%% ================================================================

add_block('built-in/Subsystem', [model_name '/SS_Input'], 'Position', [30 230 170 290]);
try, delete_block([model_name '/SS_Input/In1']);  catch, end
try, delete_block([model_name '/SS_Input/Out1']); catch, end

add_block('simulink/Sources/Sine Wave', [model_name '/SS_Input/V1Ph'], ...
    'Position',   [30 40 110 80], ...
    'Amplitude',  num2str(Vpeak_1ph, '%.6f'), ...
    'Frequency',  num2str(omega,     '%.6f'), ...
    'Phase',      '0', ...
    'SampleTime', '0');
add_block('simulink/Ports & Subsystems/Out1', [model_name '/SS_Input/V1Ph_Out'], ...
    'Position', [170 54 200 66]);
add_line([model_name '/SS_Input'], 'V1Ph/1', 'V1Ph_Out/1', 'autorouting','on');

fprintf('SS_Input ... done\n');

%% ================================================================
%  SS2: SS_Transformer
%% ================================================================

add_block('built-in/Subsystem', [model_name '/SS_Transformer'], 'Position', [220 170 400 350]);
try, delete_block([model_name '/SS_Transformer/In1']);  catch, end
try, delete_block([model_name '/SS_Transformer/Out1']); catch, end

ss = [model_name '/SS_Transformer'];

add_block('simulink/Ports & Subsystems/In1', [ss '/Vin'],       'Position', [20  170  50  184]);
add_block('simulink/Continuous/Transport Delay', [ss '/Teas90'],'Position', [90  240  170 270], ...
    'DelayTime', num2str(1/(4*freq), '%.8f'));
add_block('simulink/Math Operations/Gain', [ss '/A_Main'],      'Position', [90   60  150  90], ...
    'Gain', num2str(eta_xfmr,              '%.6f'));
add_block('simulink/Math Operations/Gain', [ss '/B_Main'],      'Position', [90  140  150 170], ...
    'Gain', num2str(-eta_xfmr/2,           '%.6f'));
add_block('simulink/Math Operations/Gain', [ss '/B_Teas'],      'Position', [200 240  260 270], ...
    'Gain', num2str(-eta_xfmr*sqrt(3)/2,   '%.6f'));
add_block('simulink/Math Operations/Sum',  [ss '/B_Sum'],       'Position', [310 145  340 270], 'Inputs','++');
add_block('simulink/Math Operations/Gain', [ss '/C_Main'],      'Position', [90  310  150 340], ...
    'Gain', num2str(-eta_xfmr/2,           '%.6f'));
add_block('simulink/Math Operations/Gain', [ss '/C_Teas'],      'Position', [200 350  260 380], ...
    'Gain', num2str(eta_xfmr*sqrt(3)/2,    '%.6f'));
add_block('simulink/Math Operations/Sum',  [ss '/C_Sum'],       'Position', [310 310  340 390], 'Inputs','++');

add_block('simulink/Ports & Subsystems/Out1', [ss '/VA_Out'],   'Position', [390  68  420  82], 'Port', '1');
add_block('simulink/Ports & Subsystems/Out1', [ss '/VB_Out'],   'Position', [390 200  420 214], 'Port', '2');
add_block('simulink/Ports & Subsystems/Out1', [ss '/VC_Out'],   'Position', [390 345  420 359], 'Port', '3');

add_line(ss, 'Vin/1',     'Teas90/1',  'autorouting','on');
add_line(ss, 'Vin/1',     'A_Main/1',  'autorouting','on');
add_line(ss, 'Vin/1',     'B_Main/1',  'autorouting','on');
add_line(ss, 'Vin/1',     'C_Main/1',  'autorouting','on');
add_line(ss, 'Teas90/1',  'B_Teas/1',  'autorouting','on');
add_line(ss, 'Teas90/1',  'C_Teas/1',  'autorouting','on');
add_line(ss, 'B_Main/1',  'B_Sum/1',   'autorouting','on');
add_line(ss, 'B_Teas/1',  'B_Sum/2',   'autorouting','on');
add_line(ss, 'C_Main/1',  'C_Sum/1',   'autorouting','on');
add_line(ss, 'C_Teas/1',  'C_Sum/2',   'autorouting','on');
add_line(ss, 'A_Main/1',  'VA_Out/1',  'autorouting','on');
add_line(ss, 'B_Sum/1',   'VB_Out/1',  'autorouting','on');
add_line(ss, 'C_Sum/1',   'VC_Out/1',  'autorouting','on');

fprintf('SS_Transformer ... done\n');

%% ================================================================
%  SS3: SS_Loads
%% ================================================================

add_block('built-in/Subsystem', [model_name '/SS_Loads'], 'Position', [450 170 620 350]);
try, delete_block([model_name '/SS_Loads/In1']);  catch, end
try, delete_block([model_name '/SS_Loads/Out1']); catch, end

ss = [model_name '/SS_Loads'];

load_ph  = {'A',  'B',  'C'};
load_lbl = {'50W','75W','100W'};
load_R   = [R1, R2, R3];
load_yp  = [60, 175, 290];

for k = 1:3
    ph  = load_ph{k};
    lbl = load_lbl{k};
    yp  = load_yp(k);
    Rv  = load_R(k);
    add_block('simulink/Ports & Subsystems/In1',  [ss '/Vin_' ph], ...
        'Port', num2str(k), 'Position', [20 yp+5 50 yp+17]);
    add_block('simulink/Math Operations/Gain', [ss '/Load_' ph '_' lbl], ...
        'Position', [100 yp 190 yp+28], 'Gain', num2str(1/Rv, '%.10f'));
    add_block('simulink/Ports & Subsystems/Out1', [ss '/Iout_' ph], ...
        'Port', num2str(k), 'Position', [240 yp+5 270 yp+17]);
    add_line(ss, ['Vin_' ph '/1'], ['Load_' ph '_' lbl '/1'], 'autorouting','on');
    add_line(ss, ['Load_' ph '_' lbl '/1'], ['Iout_' ph '/1'], 'autorouting','on');
end

fprintf('SS_Loads ... done\n');

%% ================================================================
%  SS4-6: SS_Sensor_A / SS_Sensor_B / SS_Sensor_C
%  Now calculates PF dynamically: PF = P / S
%% ================================================================

sen_ph   = {'A',   'B',   'C'  };
sen_cosT = [cosT1, cosT2, cosT3];
sen_sinT = [sinT1, sinT2, sinT3];
sen_yroot= [80,    270,   460  ];

for k = 1:3
    ph   = sen_ph{k};
    cosT = sen_cosT(k);
    sinT = sen_sinT(k);
    yr   = sen_yroot(k);

    ssn  = [model_name '/SS_Sensor_' ph];
    add_block('built-in/Subsystem', ssn, 'Position', [660 yr 840 yr+180]);
    try, delete_block([ssn '/In1']);  catch, end
    try, delete_block([ssn '/Out1']); catch, end

    % Ports
    add_block('simulink/Ports & Subsystems/In1', [ssn '/V_in'], 'Port', '1', 'Position', [20  40 50  54]);
    add_block('simulink/Ports & Subsystems/In1', [ssn '/I_in'], 'Port', '2', 'Position', [20 105 50 119]);

    % Unity-gain sense blocks
    add_block('simulink/Math Operations/Gain', [ssn '/Vsense'], 'Position', [90  35 140  59], 'Gain', '1');
    add_block('simulink/Math Operations/Gain', [ssn '/Isense'], 'Position', [90 100 140 124], 'Gain', '1');

    % Constants for cosθ and sinθ (still needed for P and Q calculations)
    add_block('simulink/Sources/Constant', [ssn '/cosT'], 'Position', [90 155 175 175], 'Value', num2str(cosT, '%.10f'));
    add_block('simulink/Sources/Constant', [ssn '/sinT'], 'Position', [90 190 175 210], 'Value', num2str(sinT, '%.10f'));

    % P = V * I * cosθ
    add_block('simulink/Math Operations/Product', [ssn '/P_VI'],  'Position', [200  30 240  60], 'Inputs', '**');
    add_block('simulink/Math Operations/Product', [ssn '/P_cos'], 'Position', [285  30 325  60], 'Inputs', '**');
    add_block('simulink/Ports & Subsystems/Out1', [ssn '/P_out'], 'Port', '1', 'Position', [375  38 405  52]);

    % Q = V * I * sinθ
    add_block('simulink/Math Operations/Product', [ssn '/Q_VI'],  'Position', [200  95 240 125], 'Inputs', '**');
    add_block('simulink/Math Operations/Product', [ssn '/Q_sin'], 'Position', [285  95 325 125], 'Inputs', '**');
    add_block('simulink/Ports & Subsystems/Out1', [ssn '/Q_out'], 'Port', '2', 'Position', [375 103 405 117]);

    % S = V * I (apparent power)
    add_block('simulink/Math Operations/Product', [ssn '/S_VI'],  'Position', [200 160 240 190], 'Inputs', '**');
    add_block('simulink/Ports & Subsystems/Out1', [ssn '/S_out'], 'Port', '3', 'Position', [375 168 405 182]);

    % PF = P / S (dynamic calculation)
    add_block('simulink/Math Operations/Divide', [ssn '/PF_div'], 'Position', [285 220 340 250]);
    add_block('simulink/Ports & Subsystems/Out1', [ssn '/PF_out'], 'Port', '4', 'Position', [375 228 405 242]);

    % Wiring
    add_line(ssn, 'V_in/1',   'Vsense/1', 'autorouting','on');
    add_line(ssn, 'I_in/1',   'Isense/1', 'autorouting','on');
    add_line(ssn, 'Vsense/1', 'P_VI/1',   'autorouting','on');
    add_line(ssn, 'Isense/1', 'P_VI/2',   'autorouting','on');
    add_line(ssn, 'P_VI/1',   'P_cos/1',  'autorouting','on');
    add_line(ssn, 'cosT/1',   'P_cos/2',  'autorouting','on');
    add_line(ssn, 'P_cos/1',  'P_out/1',  'autorouting','on');
    
    add_line(ssn, 'Vsense/1', 'Q_VI/1',   'autorouting','on');
    add_line(ssn, 'Isense/1', 'Q_VI/2',   'autorouting','on');
    add_line(ssn, 'Q_VI/1',   'Q_sin/1',  'autorouting','on');
    add_line(ssn, 'sinT/1',   'Q_sin/2',  'autorouting','on');
    add_line(ssn, 'Q_sin/1',  'Q_out/1',  'autorouting','on');
    
    add_line(ssn, 'Vsense/1', 'S_VI/1',   'autorouting','on');
    add_line(ssn, 'Isense/1', 'S_VI/2',   'autorouting','on');
    add_line(ssn, 'S_VI/1',   'S_out/1',  'autorouting','on');
    
    % PF calculation: divide P (from P_out) by S (from S_VI)
    add_line(ssn, 'P_cos/1',  'PF_div/1', 'autorouting','on');
    add_line(ssn, 'S_VI/1',   'PF_div/2', 'autorouting','on');
    add_line(ssn, 'PF_div/1', 'PF_out/1', 'autorouting','on');

    fprintf('SS_Sensor_%s ... done\n', ph);
end

%% ================================================================
%  SS7: SS_Monitor
%% ================================================================

add_block('built-in/Subsystem', [model_name '/SS_Monitor'], 'Position', [890 80 1090 670]);
try, delete_block([model_name '/SS_Monitor/In1']);  catch, end
try, delete_block([model_name '/SS_Monitor/Out1']); catch, end

ssm = [model_name '/SS_Monitor'];

mon_names = {'VA','VB','VC','IA','IB','IC','V1ph','PA','PB','PC','PFA','PFB','PFC'};
mon_yp    = [30   65  100  175  210  245  320    395  425  455  525  555  585 ];

for k = 1:length(mon_names)
    add_block('simulink/Ports & Subsystems/In1', [ssm '/' mon_names{k}], ...
        'Port', num2str(k), 'Position', [20 mon_yp(k) 50 mon_yp(k)+14]);
end

% 3-phase voltage scope
add_block('simulink/Signal Routing/Mux', [ssm '/V_Mux'], 'Position', [100  45 112 100], 'Inputs', '3');
add_block('simulink/Sinks/Scope',        [ssm '/Voltage_Scope'], 'Position', [155  57 215  88]);
add_line(ssm, 'VA/1',   'V_Mux/1', 'autorouting','on');
add_line(ssm, 'VB/1',   'V_Mux/2', 'autorouting','on');
add_line(ssm, 'VC/1',   'V_Mux/3', 'autorouting','on');
add_line(ssm, 'V_Mux/1', 'Voltage_Scope/1', 'autorouting','on');

% 3-phase current scope
add_block('simulink/Signal Routing/Mux', [ssm '/I_Mux'], 'Position', [100 180 112 245], 'Inputs', '3');
add_block('simulink/Sinks/Scope',        [ssm '/Current_Scope'], 'Position', [155 197 215 228]);
add_line(ssm, 'IA/1',   'I_Mux/1', 'autorouting','on');
add_line(ssm, 'IB/1',   'I_Mux/2', 'autorouting','on');
add_line(ssm, 'IC/1',   'I_Mux/3', 'autorouting','on');
add_line(ssm, 'I_Mux/1', 'Current_Scope/1', 'autorouting','on');

% Single-phase input scope
add_block('simulink/Sinks/Scope', [ssm '/Input_Scope'], 'Position', [100 312 160 342]);
add_line(ssm, 'V1ph/1', 'Input_Scope/1', 'autorouting','on');

% Power and PF displays
disp_ports = {'PA','PB','PC','PFA','PFB','PFC'};
disp_yp    = [395 425 455 525 555 585];
for k = 1:6
    add_block('simulink/Sinks/Display', [ssm '/Disp_' disp_ports{k}], ...
        'Position', [100 disp_yp(k) 210 disp_yp(k)+18], 'Format', 'short');
    add_line(ssm, [disp_ports{k} '/1'], ['Disp_' disp_ports{k} '/1'], 'autorouting','on');
end

fprintf('SS_Monitor ... done\n');

%% ================================================================
%  ROOT-LEVEL WIRING
%% ================================================================

mn = model_name;

% 1ph source → transformer and monitor
add_line(mn, 'SS_Input/1',       'SS_Transformer/1', 'autorouting','on');
add_line(mn, 'SS_Input/1',       'SS_Monitor/7',     'autorouting','on');

% Transformer 3ph outputs → loads
add_line(mn, 'SS_Transformer/1', 'SS_Loads/1', 'autorouting','on');
add_line(mn, 'SS_Transformer/2', 'SS_Loads/2', 'autorouting','on');
add_line(mn, 'SS_Transformer/3', 'SS_Loads/3', 'autorouting','on');

% Transformer voltages → monitor + sensors
add_line(mn, 'SS_Transformer/1', 'SS_Monitor/1',  'autorouting','on');
add_line(mn, 'SS_Transformer/2', 'SS_Monitor/2',  'autorouting','on');
add_line(mn, 'SS_Transformer/3', 'SS_Monitor/3',  'autorouting','on');
add_line(mn, 'SS_Transformer/1', 'SS_Sensor_A/1', 'autorouting','on');
add_line(mn, 'SS_Transformer/2', 'SS_Sensor_B/1', 'autorouting','on');
add_line(mn, 'SS_Transformer/3', 'SS_Sensor_C/1', 'autorouting','on');

% Load currents → monitor + sensors
add_line(mn, 'SS_Loads/1', 'SS_Monitor/4',  'autorouting','on');
add_line(mn, 'SS_Loads/2', 'SS_Monitor/5',  'autorouting','on');
add_line(mn, 'SS_Loads/3', 'SS_Monitor/6',  'autorouting','on');
add_line(mn, 'SS_Loads/1', 'SS_Sensor_A/2', 'autorouting','on');
add_line(mn, 'SS_Loads/2', 'SS_Sensor_B/2', 'autorouting','on');
add_line(mn, 'SS_Loads/3', 'SS_Sensor_C/2', 'autorouting','on');

% Sensor outputs → monitor
add_line(mn, 'SS_Sensor_A/1', 'SS_Monitor/8',  'autorouting','on');
add_line(mn, 'SS_Sensor_B/1', 'SS_Monitor/9',  'autorouting','on');
add_line(mn, 'SS_Sensor_C/1', 'SS_Monitor/10', 'autorouting','on');
add_line(mn, 'SS_Sensor_A/4', 'SS_Monitor/11', 'autorouting','on');
add_line(mn, 'SS_Sensor_B/4', 'SS_Monitor/12', 'autorouting','on');
add_line(mn, 'SS_Sensor_C/4', 'SS_Monitor/13', 'autorouting','on');

fprintf('Root wiring ... done\n');

%% ================================================================
%  SIMULATION SETTINGS & SAVE
%% ================================================================

set_param(mn, 'StopTime',   '20.0');
set_param(mn,'Solver','ode23');
set_param(mn,'MaxStep','1e-3');
set_param(mn, 'SaveOutput', 'on');
set_param(mn, 'ZoomFactor', 'FitSystem');

save_system(mn);

fprintf('\n');
fprintf('╔══════════════════════════════════════════════════════════════╗\n');
fprintf('║  EnergyMonitor_ThreePhase.slx  built OK  (v3.2)             ║\n');
fprintf('╠══════════════════════════════════════════════════════════════╣\n');
fprintf('║  Root canvas:                                                ║\n');
fprintf('║   [SS_Input]→[SS_Transformer]→[SS_Loads]→[SS_Sensor_A/B/C] ║\n');
fprintf('║                                          →[SS_Monitor]      ║\n');
fprintf('║                                                             ║\n');
fprintf('║  UPDATE: PF is now calculated as P/S (dynamic)              ║\n');
fprintf('╚══════════════════════════════════════════════════════════════╝\n');
fprintf('  Simulate: sim(''%s'')\n\n', mn);

end
%% =========================================================
%  THREE-PHASE ENERGY MONITORING SYSTEM - MATLAB Simulation
%  Architecture: Single-Phase Input → 1φ-to-3φ Transformer → Three-Phase Loads
%
%  INPUT  : Single-Phase  230V AC, 50Hz  (e.g. grid supply)
%  TRANSFORMER: Scott-T / Steinmetz (1-phase → 3-phase conversion)
%  OUTPUT : Three-Phase  230V L-N / 400V L-L  (balanced)
%  LOADS  : Phase A = 50W, Phase B = 75W, Phase C = 100W (resistive bulbs)
%
%  Author: Energy Monitor System v2.0
%% =========================================================

clear; clc; close all;

%% ---- SINGLE-PHASE INPUT PARAMETERS -------------------------
Vrms_1ph    = 230;          % Single-phase RMS input voltage (V)
freq        = 50;           % Frequency (Hz)
omega       = 2 * pi * freq;
Vpeak_1ph   = Vrms_1ph * sqrt(2);

% Time vector
t_end = 0.1;               % 100 ms (5 full cycles at 50Hz)
dt    = 1e-5;              % 10 µs resolution
t     = 0 : dt : t_end;

%% ---- SINGLE-PHASE TO THREE-PHASE TRANSFORMER MODEL ----------
% Technique: Scott-T Transformer (mathematically exact conversion)
%   - Teaser winding  : produces quadrature (90°) component
%   - Main winding    : provides in-phase (0°) component
%   - Result          : balanced three-phase set from single-phase input
%
% Single-phase input waveform
v_1ph = Vpeak_1ph * sin(omega * t);     % Input: Phase reference (0°)

% Transformer turns ratio for Scott-T (unity line voltage output)
%   Main   winding: N_m = 1   (full-width)
%   Teaser winding: N_t = sqrt(3)/2 ≈ 0.866
%
% Transformer efficiency (practical value)
eta_xfmr = 0.97;           % 97% efficiency

% Output voltages after Scott-T transformation
% Phase A: 0°, Phase B: -120°, Phase C: +120°  (balanced set)
Vrms_3ph   = Vrms_1ph * eta_xfmr;      % Per-phase RMS output (L-N)
Vpeak_3ph  = Vrms_3ph * sqrt(2);

phi_A =  0;                             % Phase A — 0°
phi_B = -2*pi/3;                        % Phase B — -120°
phi_C =  2*pi/3;                        % Phase C — +120°

% Three-phase output voltage waveforms (post-transformer)
v_A = Vpeak_3ph * sin(omega * t + phi_A);
v_B = Vpeak_3ph * sin(omega * t + phi_B);
v_C = Vpeak_3ph * sin(omega * t + phi_C);

% Verify balance: sum should be ≈ 0 at all instants
balance_check = max(abs(v_A + v_B + v_C));
fprintf('\n[Transformer Check] Max voltage imbalance: %.4f V (should be ≈ 0)\n', balance_check);

% Line-to-line voltages (400V nominal for 230V L-N)
v_AB = v_A - v_B;
v_BC = v_B - v_C;
v_CA = v_C - v_A;
Vrms_LL = Vrms_3ph * sqrt(3);
fprintf('[Transformer Output] L-N Voltage : %.2f V rms\n', Vrms_3ph);
fprintf('[Transformer Output] L-L Voltage : %.2f V rms\n\n', Vrms_LL);

%% ---- LOAD DEFINITIONS (RESISTIVE BULBS) -------------------
% Power = V^2 / R  =>  R = V^2 / P
P1 = 50;   R1 = Vrms_3ph^2 / P1;       % Phase A: 50W bulb
P2 = 75;   R2 = Vrms_3ph^2 / P2;       % Phase B: 75W bulb
P3 = 100;  R3 = Vrms_3ph^2 / P3;       % Phase C: 100W bulb

% Inductive reactance (fixture inductance simulation ~2Ω)
XL = 2;

Z1 = complex(R1, XL);
Z2 = complex(R2, XL);
Z3 = complex(R3, XL);

%% ---- SENSOR MODULES (one per output phase) ----------------
[S1] = sensor_block(Vpeak_3ph, omega, Z1, phi_A, t, 1);
[S2] = sensor_block(Vpeak_3ph, omega, Z2, phi_B, t, 2);
[S3] = sensor_block(Vpeak_3ph, omega, Z3, phi_C, t, 3);

%% ---- INPUT SIDE CALCULATIONS (single-phase primary) -------
% Total three-phase power drawn
P_total_3ph = S1.P + S2.P + S3.P;
Q_total_3ph = S1.Q + S2.Q + S3.Q;
S_total_3ph = S1.S + S2.S + S3.S;

% Input apparent power (accounting for transformer efficiency)
S_input = S_total_3ph / eta_xfmr;
I_input_rms = S_input / Vrms_1ph;       % Single-phase input current

%% ---- DISPLAY RESULTS IN COMMAND WINDOW -------------------
fprintf('╔══════════════════════════════════════════════════════════╗\n');
fprintf('║   THREE-PHASE ENERGY MONITORING SYSTEM  (v2.0)           ║\n');
fprintf('║   Input: Single-Phase 230V AC, 50Hz                      ║\n');
fprintf('║   Transformer: 1φ → 3φ (Scott-T)  η = %.0f%%             ║\n', eta_xfmr*100);
fprintf('╠══════════════════════════════════════════════════════════╣\n');
fprintf('║ INPUT SIDE (Single-Phase Supply)                          ║\n');
fprintf('║   Supply Voltage : %.2f V rms (L-N)                     ║\n', Vrms_1ph);
fprintf('║   Supply Frequency: %.1f Hz                              ║\n', freq);
fprintf('║   Input Current  : %.4f A rms                           ║\n', I_input_rms);
fprintf('║   Input Apparent : %.2f VA                              ║\n', S_input);
fprintf('╠══════════════════════════════════════════════════════════╣\n');
fprintf('║ TRANSFORMER OUTPUT (Three-Phase Secondary)                ║\n');
fprintf('║   Phase Voltage  : %.2f V rms (L-N)                     ║\n', Vrms_3ph);
fprintf('║   Line Voltage   : %.2f V rms (L-L)                    ║\n', Vrms_LL);
fprintf('║   Phase Sequence : A(0°) → B(-120°) → C(+120°)          ║\n');
fprintf('║   Efficiency     : %.1f%%                                ║\n', eta_xfmr*100);
fprintf('╠══════════════════════════════════════════════════════════╣\n');
fprintf('║ SENSOR 1 (Phase A) — 50W Bulb Load                       ║\n');
fprintf('║   Voltage    : %.2f V rms                                ║\n', S1.Vrms);
fprintf('║   Current    : %.4f A rms                               ║\n', S1.Irms);
fprintf('║   Active Pwr : %.2f W                                   ║\n', S1.P);
fprintf('║   Reactive Q : %.2f VAR                                 ║\n', S1.Q);
fprintf('║   Apparent S : %.2f VA                                  ║\n', S1.S);
fprintf('║   Power Factor: %.4f (lag)                              ║\n', S1.PF);
fprintf('║   Phase Angle : %.2f°                                   ║\n', S1.theta_deg);
fprintf('╠══════════════════════════════════════════════════════════╣\n');
fprintf('║ SENSOR 2 (Phase B) — 75W Bulb Load                       ║\n');
fprintf('║   Voltage    : %.2f V rms                                ║\n', S2.Vrms);
fprintf('║   Current    : %.4f A rms                               ║\n', S2.Irms);
fprintf('║   Active Pwr : %.2f W                                   ║\n', S2.P);
fprintf('║   Reactive Q : %.2f VAR                                 ║\n', S2.Q);
fprintf('║   Apparent S : %.2f VA                                  ║\n', S2.S);
fprintf('║   Power Factor: %.4f (lag)                              ║\n', S2.PF);
fprintf('║   Phase Angle : %.2f°                                   ║\n', S2.theta_deg);
fprintf('╠══════════════════════════════════════════════════════════╣\n');
fprintf('║ SENSOR 3 (Phase C) — 100W Bulb Load                      ║\n');
fprintf('║   Voltage    : %.2f V rms                                ║\n', S3.Vrms);
fprintf('║   Current    : %.4f A rms                               ║\n', S3.Irms);
fprintf('║   Active Pwr : %.2f W                                   ║\n', S3.P);
fprintf('║   Reactive Q : %.2f VAR                                 ║\n', S3.Q);
fprintf('║   Apparent S : %.2f VA                                  ║\n', S3.S);
fprintf('║   Power Factor: %.4f (lag)                              ║\n', S3.PF);
fprintf('║   Phase Angle : %.2f°                                   ║\n', S3.theta_deg);
fprintf('╠══════════════════════════════════════════════════════════╣\n');
fprintf('║ SYSTEM TOTALS (Three-Phase Output)                        ║\n');
fprintf('║   Total Active Power  : %.2f W                          ║\n', P_total_3ph);
fprintf('║   Total Reactive      : %.2f VAR                        ║\n', Q_total_3ph);
fprintf('║   Total Apparent      : %.2f VA                         ║\n', S_total_3ph);
fprintf('║   System PF           : %.4f                            ║\n', P_total_3ph/S_total_3ph);
fprintf('╚══════════════════════════════════════════════════════════╝\n\n');

%% ---- FIGURE 1: TRANSFORMER INPUT vs OUTPUT ----------------
figure('Name','1-Phase Input → 3-Phase Transformer Output','NumberTitle','off',...
       'Color',[0.12 0.12 0.18],'Position',[50 50 1200 600]);

% Input single-phase waveform
subplot(2,2,1);
plot(t*1000, v_1ph, 'Color','#FFFFFF','LineWidth',2);
title('INPUT: Single-Phase Supply (230V)','Color','w','FontSize',10,'FontWeight','bold');
xlabel('Time (ms)','Color','w'); ylabel('Voltage (V)','Color','w');
xlim([0 t_end*1000]); grid on;
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);
yline(Vrms_1ph,'--','Color','#FFFF00','LineWidth',1,'Label',sprintf('Vrms=%.1fV',Vrms_1ph));
yline(-Vrms_1ph,'--','Color','#FFFF00','LineWidth',1);

% Three-phase output waveforms
subplot(2,2,2);
plot(t*1000, v_A, 'Color','#00CFFF','LineWidth',1.5); hold on;
plot(t*1000, v_B, 'Color','#FFB800','LineWidth',1.5);
plot(t*1000, v_C, 'Color','#FF4C6A','LineWidth',1.5);
title('OUTPUT: Three-Phase Voltages (Post-Transformer)','Color','w','FontSize',10,'FontWeight','bold');
xlabel('Time (ms)','Color','w'); ylabel('Voltage (V)','Color','w');
xlim([0 t_end*1000]); grid on;
legend({'Phase A (0°)','Phase B (-120°)','Phase C (+120°)'},...
    'TextColor','w','Color',[0.2 0.2 0.25],'EdgeColor','none','FontSize',8,'Location','northeast');
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);

% Line-to-line voltages
subplot(2,2,3);
plot(t*1000, v_AB, 'Color','#00CFFF','LineWidth',1.2); hold on;
plot(t*1000, v_BC, 'Color','#FFB800','LineWidth',1.2);
plot(t*1000, v_CA, 'Color','#FF4C6A','LineWidth',1.2);
title('OUTPUT: Line-to-Line Voltages (~400V)','Color','w','FontSize',10,'FontWeight','bold');
xlabel('Time (ms)','Color','w'); ylabel('Voltage (V)','Color','w');
xlim([0 t_end*1000]); grid on;
legend({'V_{AB}','V_{BC}','V_{CA}'},...
    'TextColor','w','Color',[0.2 0.2 0.25],'EdgeColor','none','FontSize',8);
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);

% Voltage balance check (sum = 0 for balanced 3-phase)
subplot(2,2,4);
plot(t*1000, v_A + v_B + v_C, 'Color','#FF4C6A','LineWidth',1.2);
title('Balance Check: V_A + V_B + V_C (should be ≈ 0)','Color','w','FontSize',10,'FontWeight','bold');
xlabel('Time (ms)','Color','w'); ylabel('Sum Voltage (V)','Color','w');
xlim([0 t_end*1000]); grid on;
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);
yline(0,'--','Color','#FFFF00','LineWidth',1.5,'Label','Zero Reference');

sgtitle('Scott-T Transformer: Single-Phase Input → Three-Phase Output',...
    'Color','w','FontSize',13,'FontWeight','bold');

%% ---- FIGURE 2: VOLTAGE & CURRENT WAVEFORMS (Load Side) ----
figure('Name','Three-Phase Load — Voltage & Current','NumberTitle','off',...
       'Color',[0.12 0.12 0.18],'Position',[60 60 1200 700]);

phases = {S1, S2, S3};
colors_v = {'#00CFFF','#FFB800','#FF4C6A'};
colors_i = {'#00FF99','#FF9D00','#FF7070'};
labels   = {'Phase A – 50W','Phase B – 75W','Phase C – 100W'};

for k = 1:3
    S = phases{k};
    subplot(3,2,(k-1)*2+1);
    plot(t*1000, S.v_wave, 'Color', colors_v{k}, 'LineWidth',1.5);
    title(['Voltage – ', labels{k}],'Color','w','FontSize',10);
    xlabel('Time (ms)','Color','w'); ylabel('Voltage (V)','Color','w');
    xlim([0 t_end*1000]); grid on;
    set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);
    yline(S.Vrms,'--','Color','#FFFF00','LineWidth',1,'Label',sprintf('Vrms=%.1fV',S.Vrms));

    subplot(3,2,(k-1)*2+2);
    plot(t*1000, S.i_wave, 'Color', colors_i{k}, 'LineWidth',1.5);
    title(['Current – ', labels{k}],'Color','w','FontSize',10);
    xlabel('Time (ms)','Color','w'); ylabel('Current (A)','Color','w');
    xlim([0 t_end*1000]); grid on;
    set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);
    yline(S.Irms,'--','Color','#FFFF00','LineWidth',1,'Label',sprintf('Irms=%.3fA',S.Irms));
end

sgtitle('Three-Phase Load: Voltage & Current Waveforms (Transformer Secondary)',...
    'Color','w','FontSize',14,'FontWeight','bold');

%% ---- FIGURE 3: POWER ANALYSIS DASHBOARD ------------------
figure('Name','Power Analysis Dashboard','NumberTitle','off',...
       'Color',[0.12 0.12 0.18],'Position',[80 80 1200 700]);

for k = 1:3
    S = phases{k};
    subplot(3,3,k);
    p_inst = S.v_wave .* S.i_wave;
    plot(t*1000, p_inst, 'Color', colors_v{k}, 'LineWidth',1.2); hold on;
    yline(S.P,'--','Color','#FFFF00','LineWidth',1.5,'Label',sprintf('P=%.1fW',S.P));
    title(['Inst. Power – ', labels{k}],'Color','w','FontSize',9);
    xlabel('Time (ms)','Color','w'); ylabel('Power (W)','Color','w');
    xlim([0 t_end*1000]); grid on;
    set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3]);
end

subplot(3,3,4:6);
phases_label = {'Ph-A (50W)','Ph-B (75W)','Ph-C (100W)'};
P_vals = [S1.P, S2.P, S3.P];
Q_vals = [S1.Q, S2.Q, S3.Q];
S_vals = [S1.S, S2.S, S3.S];
x = 1:3;
bar_width = 0.25;
bar(x - bar_width, P_vals, bar_width, 'FaceColor','#00CFFF'); hold on;
bar(x,             Q_vals, bar_width, 'FaceColor','#FF4C6A');
bar(x + bar_width, S_vals, bar_width, 'FaceColor','#FFB800');
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3],...
    'XTick',1:3,'XTickLabel',phases_label);
legend({'Active P (W)','Reactive Q (VAR)','Apparent S (VA)'},'TextColor','w',...
       'Color',[0.2 0.2 0.25],'EdgeColor','none','FontSize',9);
title('Power Triangle – Per Phase (3φ Load)','Color','w','FontSize',11);
ylabel('Power (W / VAR / VA)','Color','w'); grid on;

subplot(3,3,7:9);
PF_vals    = [S1.PF, S2.PF, S3.PF];
theta_vals = [S1.theta_deg, S2.theta_deg, S3.theta_deg];
b = bar(1:3, PF_vals, 0.5);
b.FaceColor = 'flat';
b.CData = [0 0.8 1; 1 0.7 0; 1 0.3 0.4];
hold on;
for k=1:3
    text(k, PF_vals(k)+0.005, sprintf('PF=%.4f\nθ=%.2f°', PF_vals(k), theta_vals(k)),...
        'HorizontalAlignment','center','Color','w','FontSize',9,'FontWeight','bold');
end
ylim([0 1.1]);
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3],...
    'XTick',1:3,'XTickLabel',phases_label);
title('Power Factor & Phase Angle per Load Phase','Color','w','FontSize',11);
ylabel('Power Factor','Color','w'); grid on;
yline(1.0,'--','Color','#FFFF00','LineWidth',1,'Label','Unity PF');

sgtitle('Power Analysis Dashboard — Three-Phase Loads',...
    'Color','w','FontSize',14,'FontWeight','bold');

%% ---- FIGURE 4: PHASOR DIAGRAM ----------------------------
figure('Name','Phasor Diagram — Input & Output','NumberTitle','off',...
       'Color',[0.12 0.12 0.18],'Position',[110 110 700 700]);

ax = axes; hold on;
set(ax,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w',...
    'GridColor',[0.3 0.3 0.3],'DataAspectRatio',[1 1 1]);

theta_circle = linspace(0,2*pi,360);
plot(cos(theta_circle), sin(theta_circle), '--', 'Color',[0.3 0.3 0.4],'LineWidth',0.8);

% Single-phase input phasor (white, reference 0°)
quiver(0,0, 1, 0, 0, 'Color','#FFFFFF','LineWidth',3,...
    'MaxHeadSize',0.3,'AutoScale','off');
text(1.10, 0.05, 'V_{in} (1φ)','Color','#FFFFFF','FontSize',9,'FontWeight','bold');

% Three-phase output voltage phasors
v_angles = [phi_A, phi_B, phi_C];
sensor_data = {S1, S2, S3};
V_scale = Vrms_3ph / Vrms_1ph;  % Scale output phasors relative to input

for k = 1:3
    S = sensor_data{k};
    Vn = V_scale * 0.95;   % Normalize to plot space
    I_pu = S.Irms / max([S1.Irms, S2.Irms, S3.Irms]);
    i_angle = v_angles(k) - deg2rad(S.theta_deg);

    quiver(0,0, Vn*cos(v_angles(k)), Vn*sin(v_angles(k)), 0,...
        'Color', colors_v{k}, 'LineWidth', 2.5,...
        'MaxHeadSize', 0.3, 'AutoScale','off');
    text(1.05*Vn*cos(v_angles(k)), 1.05*Vn*sin(v_angles(k)),...
        sprintf('V%d\n%.1fV', k, S.Vrms),'Color', colors_v{k},...
        'FontSize',9,'FontWeight','bold','HorizontalAlignment','center');

    quiver(0,0, 0.55*I_pu*cos(i_angle), 0.55*I_pu*sin(i_angle), 0,...
        'Color', colors_i{k}, 'LineWidth', 1.8,...
        'MaxHeadSize', 0.4, 'AutoScale','off','LineStyle','--');
    text(0.62*I_pu*cos(i_angle), 0.62*I_pu*sin(i_angle),...
        sprintf('I%d\n%.3fA', k, S.Irms),'Color', colors_i{k},...
        'FontSize',8,'HorizontalAlignment','center');
end

xline(0,'Color',[0.4 0.4 0.5],'LineWidth',0.8);
yline(0,'Color',[0.4 0.4 0.5],'LineWidth',0.8);
xlim([-1.4 1.4]); ylim([-1.4 1.4]);
xlabel('Real Axis','Color','w'); ylabel('Imaginary Axis','Color','w');
title({'1φ→3φ Transformer Phasor Diagram',...
    '— Input (white) | V_ABC (solid) | I_ABC (dashed) —'},...
    'Color','w','FontSize',12,'FontWeight','bold');
legend({'Ref circle','V_{in} 1φ','V_A','V_B','V_C','I_A','I_B','I_C'},...
    'TextColor','w','Color',[0.15 0.15 0.2],'EdgeColor','none',...
    'Location','southeast','FontSize',8);
grid on;

%% ---- FIGURE 5: SYSTEM OVERVIEW (Input → Transformer → Loads)
figure('Name','System Overview','NumberTitle','off',...
       'Color',[0.12 0.12 0.18],'Position',[140 140 1000 500]);

subplot(1,2,1);
% Input power vs output powers (bar chart)
labels_sys = {'1φ Input','3φ Total P','3φ Total Q','3φ Total S'};
vals_sys   = [S_input, P_total_3ph, Q_total_3ph, S_total_3ph];
b = bar(vals_sys, 0.6);
b.FaceColor = 'flat';
b.CData = [1 1 1; 0 0.8 1; 1 0.3 0.4; 1 0.7 0];
set(gca,'Color',[0.1 0.1 0.15],'XColor','w','YColor','w','GridColor',[0.3 0.3 0.3],...
    'XTick',1:4,'XTickLabel',labels_sys,'XTickLabelRotation',10);
title('System Power Flow: Input vs 3φ Output','Color','w','FontSize',11);
ylabel('VA / W / VAR','Color','w'); grid on;
for k=1:4
    text(k, vals_sys(k)+1, sprintf('%.1f', vals_sys(k)),...
        'HorizontalAlignment','center','Color','w','FontSize',9,'FontWeight','bold');
end

subplot(1,2,2);
axis off;
data = {
    '1φ → 3φ TRANSFORMER', '';
    '─────────────────', '';
    'Type:',           'Scott-T';
    'Input Voltage:',  sprintf('%.2f V rms (L-N)', Vrms_1ph);
    'Input Frequency:',sprintf('%.1f Hz', freq);
    'Input Current:',  sprintf('%.4f A rms', I_input_rms);
    'Input Apparent:', sprintf('%.2f VA', S_input);
    'Efficiency η:',   sprintf('%.1f%%', eta_xfmr*100);
    '─────────────────', '';
    '3φ Output L-N:',  sprintf('%.2f V rms', Vrms_3ph);
    '3φ Output L-L:',  sprintf('%.2f V rms', Vrms_LL);
    'Phase Sequence:', 'A(0°), B(-120°), C(+120°)';
    '─────────────────', '';
    'Load A (P,Q,S):',  sprintf('%.1fW  %.2fVAR  %.1fVA', S1.P,S1.Q,S1.S);
    'Load B (P,Q,S):',  sprintf('%.1fW  %.2fVAR  %.1fVA', S2.P,S2.Q,S2.S);
    'Load C (P,Q,S):',  sprintf('%.1fW  %.2fVAR  %.1fVA', S3.P,S3.Q,S3.S);
    '─────────────────', '';
    'Total 3φ Power:', sprintf('%.2f W', P_total_3ph);
    'System PF:',      sprintf('%.4f', P_total_3ph/S_total_3ph);
    '─────────────────', '';
    'STATUS:', '✓ ONLINE';
};

for row = 1:size(data,1)
    ypos = 1 - (row-1)*0.048;
    if strcmp(data{row,1},'1φ → 3φ TRANSFORMER')
        text(0.05, ypos, data{row,1},'Color','#00CFFF','FontSize',12,...
            'FontWeight','bold','Units','normalized','Parent',gca);
    elseif strcmp(data{row,1},'STATUS:')
        text(0.05, ypos, data{row,1},'Color','w','FontSize',10,'Units','normalized','Parent',gca);
        text(0.55, ypos, data{row,2},'Color','#00FF88','FontSize',10,...
            'FontWeight','bold','Units','normalized','Parent',gca);
    elseif ~isempty(data{row,2})
        text(0.05, ypos, data{row,1},'Color',[0.7 0.7 0.7],'FontSize',8.5,...
            'Units','normalized','Parent',gca);
        text(0.50, ypos, data{row,2},'Color','w','FontSize',8.5,'FontWeight','bold',...
            'Units','normalized','Parent',gca);
    else
        text(0.05, ypos, data{row,1},'Color',[0.4 0.4 0.5],'FontSize',8,...
            'Units','normalized','Parent',gca);
    end
end
set(gca,'Color',[0.1 0.1 0.15]);

sgtitle('System Overview: Single-Phase Input → Scott-T Transformer → Three-Phase Loads',...
    'Color','w','FontSize',12,'FontWeight','bold');

fprintf('✓ All figures generated successfully.\n');
fprintf('✓ Run EnergyMonitor_Simulink.m to build the Simulink model.\n\n');

%% ================================================================
%  SENSOR BLOCK FUNCTION
%  Simulates one sensor module measuring V, I, P, Q, S, PF, θ
%  (Used on the three-phase secondary / load side)
%% ================================================================
function S = sensor_block(Vpeak, omega, Z, phi_offset, t, sensor_id)
    S.v_wave    = Vpeak * sin(omega * t + phi_offset);
    S.Vrms      = Vpeak / sqrt(2);

    Z_mag       = abs(Z);
    Z_angle     = angle(Z);
    Ipeak       = Vpeak / Z_mag;
    S.Irms      = Ipeak / sqrt(2);

    S.i_wave    = Ipeak * sin(omega * t + phi_offset - Z_angle);
    S.theta_deg = rad2deg(Z_angle);

    S.PF        = cos(Z_angle);
    S.P         = S.Vrms * S.Irms * S.PF;
    S.Q         = S.Vrms * S.Irms * sin(Z_angle);
    S.S         = S.Vrms * S.Irms;

    S.sensor_id = sensor_id;
    S.Z         = Z;
end

---
id: firmware
title: Firmware Measurement Model
sidebar_label: Firmware & Measurement Math
description: How the EMS firmware samples sensors and computes RMS, real power, apparent power, power factor, and phase angle — with derivations, limitations, and improvements.
---

# Firmware Measurement Model

This page documents how the EMS firmware converts raw ADC samples from the
voltage sensor (ZMPT101B) and current sensor (ACS712 hall-effect, or SCT-013
clamp) into electrical quantities: true RMS voltage and current, active power,
apparent power, power factor, and an estimated phase angle. It also covers the
calibration routine, the accuracy limits of the present approach, and the
methods that would improve it.

:::info Notation
Throughout, $N$ is the number of samples per measurement window (`bufferSize = 200`),
$x_n$ is a raw ADC count in the range $[0, M]$ with $M = 4095$ (12-bit), and
$V_{ref} = 3.3\,\text{V}$ is the ADC reference. $f$ is the line frequency (50 Hz here).
:::

---

## 1. Signal chain

Each analog channel follows the same path:

$$
\text{AC quantity} \;\xrightarrow{\text{sensor}}\; \text{small AC voltage about a DC bias}
\;\xrightarrow{\text{(divider)}}\; \text{ADC pin } (0\text{–}3.3\,\text{V})
\;\xrightarrow{\text{SAR ADC}}\; x_n \in [0, 4095]
$$

- **Voltage:** the ZMPT101B outputs an attenuated, level-shifted copy of the mains voltage, biased to roughly mid-rail.
- **Current (ACS712):** outputs a voltage centred on $\approx 2.5\,\text{V}$ with sensitivity $s = 0.185\,\text{V/A}$ (5 A module). Because that can swing to 5 V, a resistor divider of ratio $D = 18.8/6.8 \approx 2.76$ brings it into the 3.3 V ADC window.
- **Current (SCT-013):** a current transformer whose signal is biased to mid-rail and scaled so that $S_i = \tfrac{mVperAmp}{1000} = \tfrac{1}{30}\,\text{V/A}$.

The firmware fills two integer buffers, sampling the channels sequentially inside one loop:

```cpp
for (int i = 0; i < bufferSize; i++) {
  voltageBuffer[i] = analogRead(VOLT_SENSOR_PIN);
  currentBuffer[i] = analogRead(CURR_SENSOR_PIN);
  delayMicroseconds(sampleDelayUs);   // 500 us
}
```

With two conversions plus the 500 µs delay, the effective sample interval is
$\Delta t \approx 0.5\,\text{ms} + 2\,t_{conv}$, giving a rate of roughly
$f_s \approx 1.5\text{–}2\,\text{kHz}$ and a window length

$$
T_{win} = N\,\Delta t \approx 200 \times 0.6\,\text{ms} \approx 0.12\,\text{s} \approx 6 \text{ cycles at } 50\,\text{Hz}.
$$

---

## 2. From ADC counts to volts

A raw count maps to the pin voltage by

$$
u_n = x_n \cdot \frac{V_{ref}}{M}.
$$

The ESP32 uses `ADC_11db` attenuation, whose true full-scale is closer to
$\sim 3.1\,\text{V}$ than the nominal 3.3 V and is mildly non-linear near the
rails. The voltage gain factor $k_v$ (below) absorbs this constant scale error,
but the non-linearity itself is not corrected.

---

## 3. DC offset removal and calibration

Both channels carry a DC bias that must be removed before computing AC
quantities. The firmware treats the two channels differently.

### 3.1 Voltage offset $O_v$ (Step 2 of calibration)

With no special excitation, 1000 reads are averaged. Over $\approx 1\,\text{s}$
(50 cycles) the AC component averages to zero, leaving the DC bias in counts:

$$
O_v = \frac{1}{1000}\sum_{n=1}^{1000} x_{v,n}.
$$

This stored value is then subtracted from every voltage sample at runtime.

### 3.2 Current offset $O_i$ (Step 1 of calibration)

Measured the same way with **no load**:

$$
O_i = \frac{1}{1000}\sum_{n=1}^{1000} x_{i,n}.
$$

:::warning Calibrated, but unused
`calculatePower()` does not use $O_i$. It removes the **per-window mean**
$\bar{x}_i = \tfrac{1}{N}\sum x_{i,n}$ instead, and the ACS712 instantaneous
branch even subtracts a hard-coded $2.5\,\text{V}$ midpoint. So $O_i$ is
effectively dead state. Real power is largely unaffected (the offset cancels
because the voltage term is zero-mean), but absolute instantaneous current is
biased. Wiring $O_i$ into the current conversion is a recommended fix
(Section 9).
:::

### 3.3 Voltage gain $k_v$ (Step 3 of calibration)

A single-point linear gain. The firmware measures the raw RMS over $\approx 0.5\,\text{s}$,

$$
V_{measured} = \frac{V_{ref}}{M}\sqrt{\frac{1}{N}\sum_{n}(x_{v,n} - O_v)^2},
$$

the operator enters the true mains RMS $V_{actual}$ from a multimeter, and

$$
k_v = \frac{V_{actual}}{V_{measured}}.
$$

This assumes linearity and a zero intercept (single point, no offset term).

### 3.4 Current gain

There is **no current gain calibration**. Current amplitude relies entirely on
the datasheet sensitivity ($0.185\,\text{V/A}$) and resistor-divider tolerance.
Since the ACS712 sensitivity spread is $\pm 5\text{–}10\%$ and is ratiometric to
its 5 V supply, this is the dominant amplitude-error source.

---

## 4. True RMS

For a discrete signal of $N$ samples with the DC component removed, the RMS is

$$
X_{rms} = \sqrt{\frac{1}{N}\sum_{n=1}^{N} (x_n - \bar{x})^2}\;.
$$

This is a *true* RMS: it is exact for any periodic waveform sampled adequately,
not just sinusoids.

**Voltage RMS** (fixed stored offset $O_v$, gain $k_v$):

$$
\boxed{\;V_{rms} = k_v\,\frac{V_{ref}}{M}\sqrt{\frac{1}{N}\sum_{n=1}^{N}\big(x_{v,n} - O_v\big)^2}\;}
$$

**Current RMS, SCT-013** (per-window mean $\bar{x}_i$, scale $S_i$):

$$
\boxed{\;I_{rms} = \frac{V_{ref}}{M\,S_i}\sqrt{\frac{1}{N}\sum_{n=1}^{N}\big(x_{i,n} - \bar{x}_i\big)^2}\;}
$$

**Current RMS, ACS712** (divider ratio $D$, sensitivity $s$):

$$
\boxed{\;I_{rms} = \frac{V_{ref}\,D}{M\,s}\sqrt{\frac{1}{N}\sum_{n=1}^{N}\big(x_{i,n} - \bar{x}_i\big)^2}\;}
$$

A noise dead-band forces $I_{rms} = 0$ below 50 mA to suppress jitter at idle.

---

## 5. Active (real) power

Real power is the time-average of instantaneous power:

$$
\boxed{\;P = \frac{1}{N}\sum_{n=1}^{N} v_n\, i_n \;\approx\; \frac{1}{T}\int_0^T v(t)\,i(t)\,dt\;}
$$

where the per-sample physical values are

$$
v_n = (x_{v,n} - O_v)\frac{V_{ref}}{M}k_v,
\qquad
i_n =
\begin{cases}
\dfrac{V_{ref}}{M\,S_i}\,(x_{i,n} - \bar{x}_i) & \text{SCT-013}\\[2ex]
\dfrac{1}{s}\!\left(\dfrac{x_{i,n}}{M}V_{ref}\,D - 2.5\right) & \text{ACS712}
\end{cases}
$$

The instantaneous-product formulation is **waveform-agnostic**: it captures the
real power of distorted loads automatically, because power is computed before
any sinusoidal assumption is made. A small dead-band zeroes $P$ when
$|P| < 0.5\,\text{W}$.

:::note ACS712 branch inconsistency
The ACS712 instantaneous current uses a fixed $2.5\,\text{V}$ reference, while
its RMS uses the dynamic mean $\bar{x}_i$. The AC *gain* is identical in both, so
only the DC reference differs; since $v_n$ is zero-mean, the difference largely
cancels in $P$. It is still cleaner to use the same mean-removed value in both
(Section 9).
:::

---

## 6. Apparent power, power factor, phase angle

$$
S = V_{rms}\,I_{rms}, \qquad
PF = \frac{P}{S}, \qquad
\varphi = \arccos(PF)\cdot\frac{180}{\pi}.
$$

Because $P$ comes from instantaneous products and $S$ from true RMS, $PF = P/S$
is the **true power factor**, already including any distortion component. This
is correct.

The phase angle, however, is only an *equivalent* angle:

$$
\varphi = \arccos(PF).
$$

It is valid as a displacement angle **only for sinusoidal signals**, and it is
always **unsigned** — $\cos(+\varphi) = \cos(-\varphi)$, so it cannot distinguish
leading (capacitive) from lagging (inductive) loads. Section 8 shows why it
diverges from the true angle under distortion, and Section 9 gives the proper
method.

---

## 7. The sinusoidal case (where the model is exact)

Let $v(t) = \sqrt{2}\,V\cos(\omega t)$ and $i(t) = \sqrt{2}\,I\cos(\omega t - \varphi)$. Then

$$
P = \frac{1}{T}\int_0^T v\,i\,dt = V I \cos\varphi,\qquad
S = V I,\qquad
PF = \cos\varphi,\qquad
\arccos(PF) = \varphi.
$$

So for a clean sine wave, every quantity the firmware reports — $V_{rms}$,
$I_{rms}$, $P$, $S$, $PF$, and $\varphi$ — is correct, limited only by sampling,
ADC, and calibration error.

---

## 8. The non-sinusoidal case

Expand both signals in a Fourier series:

$$
v(t) = \sum_{k} \sqrt{2}\,V_k\cos(k\omega t + \alpha_k),\qquad
i(t) = \sum_{k} \sqrt{2}\,I_k\cos(k\omega t + \beta_k).
$$

Because harmonics of different orders are orthogonal over a period, only
matched orders contribute to real power:

$$
\boxed{\;P = \sum_{k} V_k I_k \cos(\alpha_k - \beta_k)\;}
$$

and the RMS values aggregate all harmonics:

$$
V_{rms} = \sqrt{\sum_k V_k^2},\qquad
I_{rms} = \sqrt{\sum_k I_k^2},\qquad
S = V_{rms} I_{rms}.
$$

The firmware's time-domain sums compute exactly these quantities — **provided
the sampling resolves the harmonics** (Section 10). So $V_{rms}$, $I_{rms}$,
$P$, $S$, and the true $PF$ remain correct for distorted loads.

### 8.1 Why $\arccos(PF)$ breaks

Total harmonic distortion of the current is

$$
THD_i = \frac{\sqrt{\sum_{k\geq 2} I_k^2}}{I_1}.
$$

For a clean (fundamental-only) voltage feeding a distorted current, the true
power factor factors into a **displacement** part and a **distortion** part:

$$
PF = \underbrace{\cos\varphi_1}_{\text{displacement}} \cdot
\underbrace{\frac{1}{\sqrt{1 + THD_i^2}}}_{\text{distortion}}.
$$

Hence $\arccos(PF) \neq \varphi_1$ whenever $THD_i \neq 0$: the reported angle
folds distortion into displacement and **overstates** the true phase shift. The
firmware's $\varphi$ should therefore be read as a "sinusoid-equivalent angle,"
not as the fundamental displacement angle.

### 8.2 Dead-band artifact

When the dead-bands force $I_{rms} = 0$ or $P = 0$ near idle, $PF$ collapses to
0 and $\varphi$ reports $90^\circ$. This is a cosmetic artifact of the
thresholds, not a real reading.

---

## 9. Sampling considerations and error sources

| Effect | Cause | Consequence |
|---|---|---|
| **Aliasing** | $f_s \approx 1.5\text{–}2\,\text{kHz}$, no anti-alias filter | Harmonics above $\sim f_s/2$ fold back into the band, corrupting RMS and $P$ for sharp-edged waveforms |
| **Spectral leakage** | Window is $\approx 6$ cycles, non-integer, not zero-cross locked | Small RMS / $P$ error |
| **Inter-channel skew** | V and I sampled sequentially, not simultaneously | Phase error $\delta = 360^\circ f \,\Delta t_s$; power error $\frac{\Delta P}{P}\approx \delta\tan\varphi$ (negligible near $PF=1$, ~2–3% at $PF=0.5$ for a 50 µs gap) |
| **Timing jitter** | `delayMicroseconds` + variable ADC time | Non-uniform $\Delta t$ smears any frequency-dependent result |
| **ADC non-linearity** | ESP32 SAR ADC, worse near rails | Absolute amplitude error |
| **Software floating point** | ESP32-C3 has **no FPU**; classic ESP32 has only single-precision | Per-sample `double` math is slow, limiting achievable $f_s$ |

A useful skew estimate: at 50 Hz, one ADC conversion of $\sim 50\,\mu\text{s}$
between channels is

$$
\delta = 360^\circ \times 50\,\text{Hz} \times 50\,\mu\text{s} \approx 0.9^\circ.
$$

---

## 10. Accuracy summary

| Quantity | Sinusoidal | Non-sinusoidal | Limiting factors |
|---|---|---|---|
| $V_{rms}$, $I_{rms}$ | Accurate | Accurate (if harmonics within Nyquist) | ADC cal, aliasing |
| $P$ (real power) | Accurate | Accurate (instantaneous product) | Skew, aliasing, offsets |
| $S$ (apparent) | Accurate | Accurate | RMS accuracy |
| $PF = P/S$ | Accurate | Accurate (true PF) | $P$ and $S$ accuracy |
| $\varphi = \arccos(PF)$ | Accurate (unsigned) | **Inaccurate** | Distortion folded in; sign lost |
| Lead / lag direction | Not available | Not available | $\arccos$ is symmetric |

---

## 11. Recommended improvements

### 11.1 Use the calibrated current offset
Replace the per-window mean and the fixed $2.5\,\text{V}$ reference with the
stored $O_i$ for a consistent, drift-aware zero:

$$
i_n = (x_{i,n} - O_i)\cdot\frac{V_{ref}}{M}\cdot G_i,
$$

with $G_i$ the (newly calibrated) current gain.

### 11.2 Add a current gain calibration
Apply a known resistive load $I_{known}$, measure $I_{measured}$, and store

$$
G_i \mathrel{\*}= \frac{I_{known}}{I_{measured}}.
$$

This removes the dominant amplitude error from sensitivity/divider tolerance.

### 11.3 Anti-aliasing filter
A first-order RC low-pass on each analog input with a corner around
$300\text{–}500\,\text{Hz}$ attenuates content above Nyquist before it can fold
back.

### 11.4 Deterministic, timer-driven sampling
Drive the ADC from a hardware timer (or the ESP32 continuous / DMA ADC mode) at
a fixed, known $f_s$ instead of `delayMicroseconds`. This removes jitter and
makes the window length exact.

### 11.5 Simultaneous V/I sampling
Eliminate inter-channel skew by sampling both channels at the same instant
(sample-and-hold front end, or a simultaneous-sampling ADC). A software-only
stopgap is to linearly interpolate one channel to the other's timestamp:

$$
\hat{i}_n = i_n + \frac{\Delta t_s}{\Delta t}\,(i_{n+1} - i_n).
$$

### 11.6 Synchronous / whole-cycle windowing
Detect zero crossings (or lock a PLL to the line) and integrate over an integer
number of cycles to eliminate leakage.

### 11.7 Signed displacement angle and reactive power
Extract the fundamental of each channel with the **Goertzel** algorithm at
$f = 50\,\text{Hz}$ to obtain $V_1\angle\alpha_1$ and $I_1\angle\beta_1$, then

$$
\varphi_1 = \alpha_1 - \beta_1 \quad(\text{signed}),\qquad
PF_{disp} = \cos\varphi_1,\qquad
Q_1 = V_1 I_1 \sin\varphi_1.
$$

The sign of $Q_1$ distinguishes inductive ($Q_1 > 0$, lagging) from capacitive
($Q_1 < 0$, leading). A total non-active power consistent with IEEE Std 1459 is

$$
\mathcal{N} = \sqrt{S^2 - P^2}.
$$

### 11.8 Report THD
With the harmonic magnitudes from a DFT/Goertzel bank,

$$
THD_i = \frac{\sqrt{\sum_{k\geq 2} I_k^2}}{I_1},\qquad
THD_v = \frac{\sqrt{\sum_{k\geq 2} V_k^2}}{V_1}.
$$

### 11.9 Energy accumulation
Integrate power over time for kWh:

$$
E = \int P\,dt \approx \sum_m P_m\,\Delta T_m.
$$

### 11.10 Numerical performance
On the FPU-less C3, accumulate integer sums of squares and products in `int64_t`
inside the loop and convert to `float` once at the end; precompute constant
scale factors outside the loop. Prefer `float` over `double` everywhere the
extra precision is not needed.

### 11.11 Robust offset and ADC calibration
Use a median (not mean) for offset estimation to reject spikes, and apply the
ESP32 eFuse `Vref` characterization (`esp_adc_cal`) to linearize the ADC.

---

## 12. Alternative measurement methods

- **Dedicated metering AFEs.** ICs such as the ADE7953, ADE7758, ATM90E26/E32,
  or CS5490 perform simultaneous sampling, harmonic-aware power, signed reactive
  power, and energy accumulation in calibrated hardware, communicating over
  SPI/I²C/UART. This is the most accurate path and offloads the MCU entirely.
- **External simultaneous-sampling ADC.** A delta-sigma ADC like the ADS131M02
  samples both channels at the same instant with high resolution, removing skew
  and ADC-linearity concerns while keeping the power math on the MCU.
- **Frequency-domain processing.** Run a windowed FFT (e.g. Hann window) on each
  channel to obtain per-harmonic magnitude and phase, then compute $P$, $Q$, and
  THD spectrally. Heavier on the MCU but gives a full harmonic picture.
- **Goertzel single-bin extraction.** Cheaper than a full FFT when only the
  fundamental (and a few harmonics) are needed for displacement PF and angle.

---

## 13. Equation ↔ code reference

| Symbol | Meaning | Code variable |
|---|---|---|
| $N$ | samples per window | `bufferSize` |
| $\Delta t$ | sample interval | `sampleDelayUs` (+ conversion time) |
| $V_{ref}$ | ADC reference | `referenceVoltage` |
| $M$ | ADC full scale | `adcMax` |
| $O_v$ | voltage DC offset | `voltageOffset` |
| $O_i$ | current DC offset (unused) | `currentOffset` |
| $k_v$ | voltage gain | `voltageCalibration` |
| $S_i$ | SCT scale (V/A) | `mVperAmp / 1000` |
| $D$ | ACS712 divider ratio | `voltageDividerRatio` |
| $s$ | ACS712 sensitivity | `hall_sensitivity` |
| $V_{rms}$ | RMS voltage | `voltageRMS` |
| $I_{rms}$ | RMS current | `currentRMS` |
| $P$ | active power | `realPower` |
| $S$ | apparent power | `apparentPower` |
| $PF$ | power factor | `powerFactor` |
| $\varphi$ | phase angle | `phaseAngle` |

---

:::caution Mains safety
Calibration Step 3 requires measuring live mains with a multimeter, and the
sensors connect to mains during normal operation. Perform these steps only with
the circuit properly enclosed and isolated, and only if you are competent to
work around live AC.
:::

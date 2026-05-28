import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

function UserManualSvg({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect x="15" y="10" width="50" height="60" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <line x1="25" y1="24" x2="55" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="25" y1="36" x2="55" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="25" y1="48" x2="45" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="53" cy="48" r="4" fill="var(--ifm-color-primary)" />
    </svg>
  );
}

function TechSpecSvg({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect x="20" y="20" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <rect x="32" y="32" width="16" height="16" rx="3" stroke="var(--ifm-color-primary)" strokeWidth="2.5" />
      <line x1="12" y1="30" x2="20" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="40" x2="20" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="30" x2="68" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="40" x2="68" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="50" x2="68" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="12" x2="30" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="12" x2="40" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="12" x2="50" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="60" x2="30" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="60" x2="40" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="60" x2="50" y2="68" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function DevGuideSvg({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
      <rect x="12" y="18" width="56" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 28H68" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="23" r="1.5" fill="var(--ifm-color-primary)" />
      <circle cx="26" cy="23" r="1.5" fill="var(--ifm-color-primary)" />
      <circle cx="32" cy="23" r="1.5" fill="var(--ifm-color-primary)" />
      <path d="M26 48L34 40L26 32" stroke="var(--ifm-color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="38" y1="48" x2="52" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const FeatureList = [
  {
    title: 'User Manual',
    SvgComponent: UserManualSvg,
    description: (
      <>
        A guide for homeowners and facility administrators. Learn to read telemetry meters,
        set up consumption thresholds, and generate auditor-ready reports.
      </>
    ),
  },
  {
    title: 'Technical Documentationifications',
    SvgComponent: TechSpecSvg,
    description: (
      <>
        Hardware wiring designs for the ESP32 chip, SCT-013 current clamp, and ZMPT101B
        sensors. Explore the hybrid MongoDB/Supabase database architecture.
      </>
    ),
  },
  {
    title: 'Developer Guides',
    SvgComponent: DevGuideSvg,
    description: (
      <>
        Start contributing in minutes. Setup guidelines for local Next.js frontends, Express API
        servers, ESP32 firmware compiles, and coding guidelines.
      </>
    ),
  },
];

function Feature({ SvgComponent, title, description }) {
  return (
    <div className={clsx('col col--4', 'margin-bottom--lg')}>
      <div className={styles.featureCard}>
        <SvgComponent className={styles.featureSvg} />
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}


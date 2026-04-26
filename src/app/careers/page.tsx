'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  department: string;
  location?: string;
  type: 'Full-time' | 'Contract';
  overview: string;
  responsibilities: string[];
  requirements: string[];
}

const jobsData: Record<string, Job[]> = {
  'Product & Engineering': [
    {
      id: 'fe-engineer',
      title: 'Frontend Engineer',
      department: 'Product & Engineering',
      location: 'Remote / SF',
      type: 'Full-time',
      overview: 'Build responsive, performant interfaces for picknbuild platform used by thousands of car buyers.',
      responsibilities: [
        'Develop React components and pages for car search, comparison, and customization flows',
        'Optimize frontend performance and user experience',
        'Collaborate with product and design teams',
        'Implement real-time pricing calculations and vehicle comparisons',
      ],
      requirements: [
        '3+ years React/TypeScript experience',
        'Strong CSS and responsive design skills',
        'Experience with Next.js or similar frameworks',
        'Understanding of performance optimization',
      ],
    },
    {
      id: 'backend-engineer',
      title: 'Backend Engineer',
      department: 'Product & Engineering',
      location: 'Remote / SF',
      type: 'Full-time',
      overview: 'Build scalable backend systems powering vehicle inventory, pricing, and fulfillment.',
      responsibilities: [
        'Design and maintain APIs for vehicle data, inventory, and transactions',
        'Implement complex pricing logic and risk calculations',
        'Manage databases and optimize queries for performance',
        'Build real-time tracking and notification systems',
      ],
      requirements: [
        '3+ years backend development experience',
        'Proficiency in Node.js, Python, or Go',
        'Database design and optimization skills',
        'Experience with payment processing and financial systems',
      ],
    },
  ],
  'Build & Operations': [
    {
      id: 'build-coordinator',
      title: 'Build Coordinator',
      department: 'Build & Operations',
      location: 'SF / LA',
      type: 'Full-time',
      overview: 'Orchestrate vehicle builds from sourcing through delivery.',
      responsibilities: [
        'Track vehicle progress through build pipeline',
        'Coordinate between sourcing, build shop, and logistics',
        'Manage build schedules and timelines',
        'Communicate updates to customers',
      ],
      requirements: [
        'Experience in operations or logistics coordination',
        'Strong organizational and communication skills',
        'Ability to manage multiple projects simultaneously',
        'Detail-oriented problem solver',
      ],
    },
  ],
  'Customer Experience': [
    {
      id: 'cs-manager',
      title: 'Customer Success Manager',
      department: 'Customer Experience',
      location: 'Remote / SF',
      type: 'Full-time',
      overview: 'Own customer relationships from purchase through delivery.',
      responsibilities: [
        'Manage customer inquiries and support tickets',
        'Ensure smooth delivery experience',
        'Handle payment processing and issues',
        'Gather customer feedback and insights',
      ],
      requirements: [
        '2+ years in customer success or support',
        'Strong communication and problem-solving skills',
        'Experience with payments or financial products',
        'Empathy and customer-focused mindset',
      ],
    },
  ],
};

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const departments = Object.keys(jobsData);

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', paddingTop: '80px' }}>
      {/* Hero Section */}
      <section style={{ paddingTop: '60px', paddingBottom: '80px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            {/* Left: Content */}
            <div>
              <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px', lineHeight: '1.2', color: 'var(--foreground)' }}>
                Careers at picknbuild
              </h1>
              <p style={{ fontSize: '18px', color: 'var(--muted-foreground)', marginBottom: '32px', lineHeight: '1.6' }}>
                We're building the future of how people buy, build, and own cars. Join us to help transform the automotive industry.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="#roles" style={{ padding: '12px 24px', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', border: 'none' }}>
                  View Open Roles
                </a>
                <a href="#" style={{ padding: '12px 24px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', border: '1px solid var(--border)' }}>
                  Apply Anyway
                </a>
              </div>
            </div>

            {/* Right: Visual */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', height: '300px' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--muted-foreground)', textAlign: 'center', padding: '24px', border: '1px dashed var(--border)' }}>
                Raw • Source
              </div>
              <div style={{ flex: 1, backgroundColor: 'rgba(0, 204, 153, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'var(--accent)', textAlign: 'center', padding: '24px', border: '1px solid var(--accent)', fontWeight: '600' }}>
                Complete • Delivered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '48px', textAlign: 'center', color: 'var(--foreground)' }}>
            Open Roles
          </h2>

          {departments.map((dept) => {
            const jobs = jobsData[dept];
            if (!jobs) return null;
            return (
            <div key={dept} style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: 'var(--foreground)' }}>
                {dept}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    style={{
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card)';
                      e.currentTarget.style.color = 'inherit';
                    }}
                  >
                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: 'inherit' }}>
                      {job.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: '0 0 8px 0' }}>
                      {job.location} • {job.type}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
                      {job.overview.substring(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, marginBottom: '8px', color: 'var(--foreground)' }}>
                  {selectedJob.title}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
                  {selectedJob.department} • {selectedJob.location} • {selectedJob.type}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                  Overview
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--foreground)', margin: 0, lineHeight: '1.6' }}>
                  {selectedJob.overview}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                  Responsibilities
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {selectedJob.responsibilities.map((resp, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '8px' }}>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
                  Requirements
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: 'var(--foreground)', marginBottom: '8px' }}>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

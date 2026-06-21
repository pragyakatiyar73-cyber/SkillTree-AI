import { Mail, Phone, MapPin, Linkedin, Github, Globe, ExternalLink } from 'lucide-react';

interface SkillItem { skill: string; level: number }
interface CertItem { name: string; issuer: string; date: string }
interface EduItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; gpa: string }
interface ExpItem { id: string; company: string; role: string; startDate: string; endDate: string; description: string }
interface ProjItem { id: string; title: string; description: string; technologies: string[]; link: string }

interface Props {
  profile: {
    full_name: string; email: string; phone: string; location: string;
    linkedin: string; github: string; portfolio: string; website: string;
    profile_photo_url: string; professional_summary: string;
  };
  resume: {
    template: string; theme: 'light' | 'dark';
    education: EduItem[]; experience: ExpItem[];
    skills: SkillItem[]; projects: ProjItem[]; certifications: CertItem[];
  };
}

const fmtDate = (d: string) => {
  if (!d) return '';
  const [y, m] = d.split('-');
  if (!y || !m) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${y}`;
};

export default function ResumePreview({ profile, resume }: Props) {
  const { template, theme } = resume;
  const isDark = theme === 'dark';

  // Shared colors
  const c = {
    bg: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#e2e8f0' : '#1e293b',
    textLight: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    accent: '#10b981',
    accentLight: isDark ? '#059669' : '#d1fae5',
    cardBg: isDark ? '#1e293b' : '#f8fafc',
  };

  const Contact = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '11px', color: c.textLight }}>
      {profile.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> {profile.email}</span>}
      {profile.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {profile.phone}</span>}
      {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {profile.location}</span>}
      {profile.linkedin && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Linkedin size={11} /> {profile.linkedin.replace(/^https?:\/\//, '')}</span>}
      {profile.github && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Github size={11} /> {profile.github.replace(/^https?:\/\//, '')}</span>}
      {(profile.portfolio || profile.website) && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={11} /> {(profile.portfolio || profile.website).replace(/^https?:\/\//, '')}</span>}
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 16 }}>
      <div style={{ width: 3, height: 16, background: c.accent, borderRadius: 2 }} />
      <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.text }}>{children}</h3>
      <div style={{ flex: 1, height: 1, background: c.border }} />
    </div>
  );

  const SkillBar = ({ skill, level }: SkillItem) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 3 }}>
        <span style={{ color: c.text, fontWeight: 500 }}>{skill}</span>
        <span style={{ color: c.textLight }}>{['Beginner','Intermediate','Proficient','Advanced','Expert'][level - 1]}</span>
      </div>
      <div style={{ height: 4, background: c.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(level / 5) * 100}%`, background: c.accent, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  // ── TEMPLATE: MODERN (two-column) ───────────────────────────────────────
  if (template === 'modern') {
    return (
      <div style={{ width: 210, minHeight: 297, background: c.bg, color: c.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: '10px', lineHeight: 1.5, padding: '18px 20px', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, borderBottom: `1px solid ${c.border}`, paddingBottom: 12 }}>
          {profile.profile_photo_url && (
            <img src={profile.profile_photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: `2px solid ${c.accent}` }} />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: c.text }}>{profile.full_name || 'Your Name'}</h1>
            <Contact />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {/* Left column */}
          <div style={{ width: '62%' }}>
            {profile.professional_summary && (
              <>
                <SectionTitle>Summary</SectionTitle>
                <p style={{ color: c.textLight, lineHeight: 1.6, margin: 0 }}>{profile.professional_summary}</p>
              </>
            )}

            {resume.experience.length > 0 && (
              <>
                <SectionTitle>Experience</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resume.experience.map(e => (
                    <div key={e.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 700, fontSize: '11px', color: c.text }}>{e.role}</span>
                        <span style={{ fontSize: '9px', color: c.textLight }}>{fmtDate(e.startDate)} – {e.endDate ? fmtDate(e.endDate) : 'Present'}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: c.accent, fontWeight: 600, marginBottom: 2 }}>{e.company}</div>
                      <p style={{ color: c.textLight, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{e.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {resume.projects.length > 0 && (
              <>
                <SectionTitle>Projects</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resume.projects.map(p => (
                    <div key={p.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '11px' }}>{p.title}</span>
                        {p.link && <ExternalLink size={10} style={{ color: c.accent }} />}
                      </div>
                      <p style={{ color: c.textLight, margin: '2px 0', lineHeight: 1.5 }}>{p.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.technologies.map(t => (
                          <span key={t} style={{ fontSize: '8px', padding: '2px 6px', background: c.accentLight, color: c.accent, borderRadius: 4, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div style={{ width: '38%' }}>
            {resume.skills.length > 0 && (
              <>
                <SectionTitle>Skills</SectionTitle>
                {resume.skills.map(s => <SkillBar key={s.skill} {...s} />)}
              </>
            )}

            {resume.education.length > 0 && (
              <>
                <SectionTitle>Education</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resume.education.map(edu => (
                    <div key={edu.id}>
                      <div style={{ fontWeight: 700, fontSize: '10px' }}>{edu.degree}</div>
                      <div style={{ color: c.accent, fontWeight: 600, fontSize: '9px' }}>{edu.institution}</div>
                      <div style={{ color: c.textLight, fontSize: '9px' }}>{edu.field} • {fmtDate(edu.startDate)} – {fmtDate(edu.endDate)}</div>
                      {edu.gpa && <div style={{ color: c.textLight, fontSize: '9px' }}>GPA: {edu.gpa}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {resume.certifications.length > 0 && (
              <>
                <SectionTitle>Certifications</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {resume.certifications.map((cert, i) => (
                    <div key={i}>
                      <div style={{ fontWeight: 600, fontSize: '10px' }}>{cert.name}</div>
                      <div style={{ color: c.textLight, fontSize: '9px' }}>{cert.issuer} • {fmtDate(cert.date)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── TEMPLATE: MINIMAL ───────────────────────────────────────────────────
  if (template === 'minimal') {
    return (
      <div style={{ width: 210, minHeight: 297, background: c.bg, color: c.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: '10px', lineHeight: 1.6, padding: '28px 32px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {profile.profile_photo_url && (
            <img src={profile.profile_photo_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: `2px solid ${c.border}` }} />
          )}
          <h1 style={{ fontSize: '22px', fontWeight: 300, margin: '0 0 6px', letterSpacing: '0.04em', color: c.text }}>{profile.full_name || 'Your Name'}</h1>
          <Contact />
        </div>

        {profile.professional_summary && (
          <div style={{ textAlign: 'center', marginBottom: 20, padding: '0 12px' }}>
            <p style={{ color: c.textLight, margin: 0, fontStyle: 'italic' }}>{profile.professional_summary}</p>
          </div>
        )}

        {resume.experience.length > 0 && (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0 12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: c.textLight }}>Experience</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resume.experience.map(e => (
                <div key={e.id} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px' }}>{e.role}</div>
                  <div style={{ color: c.textLight, fontSize: '10px' }}>{e.company} • {fmtDate(e.startDate)} – {e.endDate ? fmtDate(e.endDate) : 'Present'}</div>
                  <p style={{ color: c.textLight, margin: '4px 0 0', fontSize: '10px' }}>{e.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {resume.education.length > 0 && (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0 12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: c.textLight }}>Education</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
              {resume.education.map(edu => (
                <div key={edu.id}>
                  <div style={{ fontWeight: 600 }}>{edu.degree} in {edu.field}</div>
                  <div style={{ color: c.textLight, fontSize: '10px' }}>{edu.institution} • {fmtDate(edu.startDate)} – {fmtDate(edu.endDate)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {resume.skills.length > 0 && (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0 12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: c.textLight }}>Skills</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 8px' }}>
              {resume.skills.map(s => (
                <span key={s.skill} style={{ fontSize: '9px', padding: '3px 10px', border: `1px solid ${c.border}`, borderRadius: 12, color: c.textLight }}>{s.skill}</span>
              ))}
            </div>
          </>
        )}

        {resume.projects.length > 0 && (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0 12px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: c.textLight }}>Projects</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
              {resume.projects.map(p => (
                <div key={p.id}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <p style={{ color: c.textLight, margin: '2px 0', fontSize: '10px' }}>{p.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── TEMPLATE: PROFESSIONAL ──────────────────────────────────────────────
  if (template === 'professional') {
    return (
      <div style={{ width: 210, minHeight: 297, background: c.bg, color: c.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: '10px', lineHeight: 1.5, boxSizing: 'border-box' }}>
        {/* Top bar */}
        <div style={{ background: isDark ? '#1e293b' : '#1e293b', color: '#ffffff', padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {profile.profile_photo_url && (
              <img src={profile.profile_photo_url} alt="" style={{ width: 52, height: 52, borderRadius: 4, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
            )}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>{profile.full_name || 'Your Name'}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '9px', color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                {profile.email && <span>{profile.email}</span>}
                {profile.phone && <span>{profile.phone}</span>}
                {profile.location && <span>{profile.location}</span>}
                {profile.linkedin && <span>{profile.linkedin.replace(/^https?:\/\//, '')}</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 22px' }}>
          {profile.professional_summary && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ color: c.textLight, margin: 0, lineHeight: 1.6 }}>{profile.professional_summary}</p>
            </div>
          )}

          {resume.experience.length > 0 && (
            <>
              <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `2px solid ${isDark ? '#334155' : '#1e293b'}`, paddingBottom: 4, marginBottom: 10 }}>Professional Experience</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {resume.experience.map(e => (
                  <div key={e.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '11px', color: c.text }}>{e.role}</span>
                      <span style={{ fontSize: '9px', color: c.textLight, fontStyle: 'italic' }}>{fmtDate(e.startDate)} – {e.endDate ? fmtDate(e.endDate) : 'Present'}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: c.accent, fontWeight: 600, marginBottom: 2 }}>{e.company}</div>
                    <p style={{ color: c.textLight, margin: 0, lineHeight: 1.5 }}>{e.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {resume.education.length > 0 && (
            <>
              <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `2px solid ${isDark ? '#334155' : '#1e293b'}`, paddingBottom: 4, margin: '16px 0 10px' }}>Education</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resume.education.map(edu => (
                  <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '11px' }}>{edu.degree} in {edu.field}</div>
                      <div style={{ color: c.textLight, fontSize: '10px' }}>{edu.institution}</div>
                    </div>
                    <div style={{ color: c.textLight, fontSize: '9px', textAlign: 'right' }}>
                      {fmtDate(edu.startDate)} – {fmtDate(edu.endDate)}<br/>{edu.gpa && `GPA: ${edu.gpa}`}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {resume.skills.length > 0 && (
            <>
              <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `2px solid ${isDark ? '#334155' : '#1e293b'}`, paddingBottom: 4, margin: '16px 0 10px' }}>Technical Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
                {resume.skills.map(s => (
                  <span key={s.skill} style={{ fontSize: '10px', fontWeight: 500, color: c.text }}>{s.skill}</span>
                ))}
              </div>
            </>
          )}

          {resume.projects.length > 0 && (
            <>
              <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `2px solid ${isDark ? '#334155' : '#1e293b'}`, paddingBottom: 4, margin: '16px 0 10px' }}>Projects</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resume.projects.map(p => (
                  <div key={p.id}>
                    <div style={{ fontWeight: 700, fontSize: '11px' }}>{p.title} {p.link && <span style={{ fontSize: '8px', color: c.accent }}>↗</span>}</div>
                    <p style={{ color: c.textLight, margin: '2px 0', fontSize: '10px' }}>{p.description}</p>
                    <div style={{ fontSize: '9px', color: c.textLight }}>{p.technologies.join(' • ')}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {resume.certifications.length > 0 && (
            <>
              <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `2px solid ${isDark ? '#334155' : '#1e293b'}`, paddingBottom: 4, margin: '16px 0 10px' }}>Certifications</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resume.certifications.map((cert, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '10px' }}>{cert.name}</span>
                    <span style={{ color: c.textLight, fontSize: '9px' }}>{cert.issuer} • {fmtDate(cert.date)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── TEMPLATE: CREATIVE ──────────────────────────────────────────────────
  if (template === 'creative') {
    return (
      <div style={{ width: 210, minHeight: 297, background: c.bg, color: c.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: '10px', lineHeight: 1.5, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
        {/* Accent sidebar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'linear-gradient(180deg, #10b981, #059669, #047857)' }} />

        <div style={{ padding: '20px 22px 20px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            {profile.profile_photo_url && (
              <img src={profile.profile_photo_url} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', border: `3px solid ${c.accent}` }} />
            )}
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: c.text, letterSpacing: '-0.02em' }}>{profile.full_name || 'Your Name'}</h1>
              <Contact />
            </div>
          </div>

          {profile.professional_summary && (
            <div style={{ background: c.cardBg, borderRadius: 10, padding: '12px 14px', marginBottom: 16, borderLeft: `3px solid ${c.accent}` }}>
              <p style={{ color: c.textLight, margin: 0, lineHeight: 1.6, fontSize: '10px' }}>{profile.professional_summary}</p>
            </div>
          )}

          {resume.experience.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BriefcaseIcon size={11} color="#fff" />
                </div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: c.text }}>Experience</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 4 }}>
                {resume.experience.map(e => (
                  <div key={e.id} style={{ position: 'relative', paddingLeft: 14, borderLeft: `2px solid ${c.border}` }}>
                    <div style={{ position: 'absolute', left: -5, top: 2, width: 8, height: 8, borderRadius: '50%', background: c.accent }} />
                    <div style={{ fontWeight: 700, fontSize: '11px' }}>{e.role}</div>
                    <div style={{ color: c.accent, fontWeight: 600, fontSize: '10px' }}>{e.company}</div>
                    <div style={{ color: c.textLight, fontSize: '9px', marginBottom: 2 }}>{fmtDate(e.startDate)} – {e.endDate ? fmtDate(e.endDate) : 'Present'}</div>
                    <p style={{ color: c.textLight, margin: 0, lineHeight: 1.5 }}>{e.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              {resume.education.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GradCapIcon size={11} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700 }}>Education</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {resume.education.map(edu => (
                      <div key={edu.id}>
                        <div style={{ fontWeight: 700, fontSize: '10px' }}>{edu.degree}</div>
                        <div style={{ color: c.textLight, fontSize: '9px' }}>{edu.institution}</div>
                        <div style={{ color: c.textLight, fontSize: '9px' }}>{fmtDate(edu.startDate)} – {fmtDate(edu.endDate)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {resume.skills.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <WrenchIcon size={11} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700 }}>Skills</h3>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {resume.skills.map(s => (
                      <span key={s.skill} style={{ fontSize: '9px', padding: '3px 8px', background: c.accentLight, color: c.accent, borderRadius: 6, fontWeight: 600 }}>{s.skill}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {resume.projects.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 10px' }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderIcon size={11} color="#fff" />
                </div>
                <h3 style={{ fontSize: '12px', fontWeight: 700 }}>Projects</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resume.projects.map(p => (
                  <div key={p.id} style={{ background: c.cardBg, borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '11px' }}>{p.title}</div>
                    <p style={{ color: c.textLight, margin: '2px 0', fontSize: '10px' }}>{p.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                      {p.technologies.map(t => (
                        <span key={t} style={{ fontSize: '8px', padding: '2px 6px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: 4, color: c.textLight }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── TEMPLATE: COMPACT (ATS-focused single column) ───────────────────────
  return (
    <div style={{ width: 210, minHeight: 297, background: c.bg, color: c.text, fontFamily: "'Inter', system-ui, sans-serif", fontSize: '9.5px', lineHeight: 1.45, padding: '16px 20px', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center', marginBottom: 10, borderBottom: `1px solid ${c.border}`, paddingBottom: 10 }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: c.text }}>{profile.full_name || 'Your Name'}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3px 10px', fontSize: '9px', color: c.textLight }}>
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{profile.phone}</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.linkedin && <span>{profile.linkedin.replace(/^https?:\/\//, '')}</span>}
          {profile.github && <span>{profile.github.replace(/^https?:\/\//, '')}</span>}
        </div>
      </div>

      {profile.professional_summary && (
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `1px solid ${c.border}`, paddingBottom: 2, marginBottom: 4 }}>Summary</h3>
          <p style={{ color: c.textLight, margin: 0 }}>{profile.professional_summary}</p>
        </div>
      )}

      {resume.experience.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `1px solid ${c.border}`, paddingBottom: 2, marginBottom: 6 }}>Experience</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resume.experience.map(e => (
              <div key={e.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: '10px' }}>{e.role}</span>
                  <span style={{ fontSize: '8.5px', color: c.textLight }}>{fmtDate(e.startDate)} – {e.endDate ? fmtDate(e.endDate) : 'Present'}</span>
                </div>
                <div style={{ fontSize: '9.5px', color: c.textLight, marginBottom: 1 }}>{e.company}</div>
                <p style={{ color: c.textLight, margin: 0 }}>{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.education.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `1px solid ${c.border}`, paddingBottom: 2, marginBottom: 6 }}>Education</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resume.education.map(edu => (
              <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '10px' }}>{edu.degree}</span>
                  <span style={{ color: c.textLight }}> — {edu.institution}</span>
                </div>
                <span style={{ color: c.textLight, fontSize: '8.5px', whiteSpace: 'nowrap' }}>{fmtDate(edu.startDate)} – {fmtDate(edu.endDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.skills.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `1px solid ${c.border}`, paddingBottom: 2, marginBottom: 4 }}>Skills</h3>
          <p style={{ color: c.textLight, margin: 0 }}>{resume.skills.map(s => s.skill).join(' • ')}</p>
        </div>
      )}

      {resume.projects.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `1px solid ${c.border}`, paddingBottom: 2, marginBottom: 6 }}>Projects</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resume.projects.map(p => (
              <div key={p.id}>
                <span style={{ fontWeight: 700, fontSize: '10px' }}>{p.title}</span>
                {p.link && <span style={{ color: c.accent, fontSize: '8.5px' }}> ({p.link})</span>}
                <p style={{ color: c.textLight, margin: '1px 0 0' }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {resume.certifications.length > 0 && (
        <div>
          <h3 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.text, borderBottom: `1px solid ${c.border}`, paddingBottom: 2, marginBottom: 4 }}>Certifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {resume.certifications.map((cert, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{cert.name}</span>
                <span style={{ color: c.textLight, fontSize: '8.5px' }}>{cert.issuer}, {fmtDate(cert.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline icon components for creative template (no lucide-react in inline styles)
function BriefcaseIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
function GradCapIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>;
}
function WrenchIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
}
function FolderIcon({ size, color }: { size: number; color: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
}

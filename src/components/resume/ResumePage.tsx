import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Download, Sparkles, Loader,
  Sun, Moon, Image, FileText, Layout, Eye, Type, Award, Briefcase,
  GraduationCap, Wrench, Folder, Save, X, Check, Palette
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ResumePreview from './ResumePreview';

// ── Types ───────────────────────────────────────────────────────────────────
interface SkillItem { skill: string; level: number }
interface CertItem { name: string; issuer: string; date: string }
interface EduItem { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; gpa: string }
interface ExpItem { id: string; company: string; role: string; startDate: string; endDate: string; description: string }
interface ProjItem { id: string; title: string; description: string; technologies: string[]; link: string }

interface ProfileData {
  id?: string;
  full_name: string; email: string; phone: string; location: string;
  linkedin: string; github: string; portfolio: string; website: string;
  profile_photo_url: string; professional_summary: string;
}

interface ResumeData {
  id?: string;
  title: string;
  template: string;
  theme: 'light' | 'dark';
  education: EduItem[];
  experience: ExpItem[];
  skills: SkillItem[];
  projects: ProjItem[];
  certifications: CertItem[];
}

const TEMPLATES = [
  { id: 'modern', name: 'Modern', desc: 'Clean two-column layout' },
  { id: 'minimal', name: 'Minimal', desc: 'Whitespace-focused elegance' },
  { id: 'professional', name: 'Professional', desc: 'Traditional corporate style' },
  { id: 'creative', name: 'Creative', desc: 'Bold with accent colors' },
  { id: 'compact', name: 'Compact', desc: 'Dense single-column ATS' },
];

const SKILL_LEVELS = [
  { label: 'Beginner', value: 1 },
  { label: 'Intermediate', value: 2 },
  { label: 'Proficient', value: 3 },
  { label: 'Advanced', value: 4 },
  { label: 'Expert', value: 5 },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Component ───────────────────────────────────────────────────────────────
export default function ResumePage() {
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '', website: '',
    profile_photo_url: '', professional_summary: '',
  });

  const [resume, setResume] = useState<ResumeData>({
    title: 'My Resume',
    template: 'modern',
    theme: 'light',
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState(3);
  const [toast, setToast] = useState('');

  // Load data
  useEffect(() => { if (user?.id) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load profile
      const { data: prof } = await supabase
        .from('resume_profiles').select('*')
        .eq('user_id', user.id).maybeSingle();
      if (prof) setProfile(prof);

      // Load latest resume
      const { data: res } = await supabase
        .from('resumes').select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      if (res) {
        setResume({
          id: res.id,
          title: res.title,
          template: res.template,
          theme: res.theme,
          education: res.education || [],
          experience: res.experience || [],
          skills: res.skills || [],
          projects: res.projects || [],
          certifications: res.certifications || [],
        });
      }
    } catch {
      // Continue with defaults
    } finally { setLoading(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upsert profile
      const profPayload = { ...profile, user_id: user.id };
      const { data: savedProf, error: profErr } = await supabase
        .from('resume_profiles').upsert(profPayload, { onConflict: 'user_id' }).select().single();
      if (profErr) throw profErr;

      // Upsert resume
      const resumePayload = {
        user_id: user.id,
        profile_id: savedProf.id,
        title: resume.title,
        template: resume.template,
        theme: resume.theme,
        education: resume.education,
        experience: resume.experience,
        skills: resume.skills,
        projects: resume.projects,
        certifications: resume.certifications,
      };
      const { data: savedRes, error: resErr } = await supabase
        .from('resumes').upsert(resumePayload, { onConflict: 'id' }).select().single();
      if (resErr) throw resErr;
      if (savedRes) setResume(prev => ({ ...prev, id: savedRes.id }));

      showToast('Resume saved successfully');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const generateSummary = async () => {
    if (!user) return;
    setGeneratingSummary(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-resume-summary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { ...profile, ...resume } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProfile(prev => ({ ...prev, professional_summary: json.summary }));
      showToast('Summary generated');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Generation failed');
    } finally { setGeneratingSummary(false); }
  };

  const uploadPhoto = async (file: File) => {
    if (!user || !file) return;
    setUploadingPhoto(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('resume-photos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('resume-photos').getPublicUrl(path);
      setProfile(prev => ({ ...prev, profile_photo_url: urlData.publicUrl }));
      showToast('Photo uploaded');
    } catch {
      showToast('Photo upload failed');
    } finally { setUploadingPhoto(false); }
  };

  const exportPDF = async () => {
    const el = previewRef.current;
    if (!el) return;
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: resume.theme === 'dark' ? '#0f172a' : '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(pageW / imgW, pageH / imgH);
    const w = imgW * ratio;
    const h = imgH * ratio;
    pdf.addImage(imgData, 'PNG', (pageW - w) / 2, 0, w, h);
    pdf.save(`${resume.title || 'resume'}.pdf`);
  };

  // ── Section helpers ───────────────────────────────────────────────────────

  const updateProfileField = (field: keyof ProfileData, value: string) => setProfile(p => ({ ...p, [field]: value }));
  const updateResume = (field: keyof ResumeData, value: unknown) => setResume(r => ({ ...r, [field]: value }));

  const addEdu = () => updateResume('education', [...resume.education, { id: crypto.randomUUID(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }]);
  const updateEdu = (id: string, field: keyof EduItem, value: string) => updateResume('education', resume.education.map(e => e.id === id ? { ...e, [field]: value } : e));
  const delEdu = (id: string) => updateResume('education', resume.education.filter(e => e.id !== id));

  const addExp = () => updateResume('experience', [...resume.experience, { id: crypto.randomUUID(), company: '', role: '', startDate: '', endDate: '', description: '' }]);
  const updateExp = (id: string, field: keyof ExpItem, value: string) => updateResume('experience', resume.experience.map(e => e.id === id ? { ...e, [field]: value } : e));
  const delExp = (id: string) => updateResume('experience', resume.experience.filter(e => e.id !== id));

  const addProj = () => updateResume('projects', [...resume.projects, { id: crypto.randomUUID(), title: '', description: '', technologies: [], link: '' }]);
  const updateProj = (id: string, field: keyof ProjItem, value: string | string[]) => updateResume('projects', resume.projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  const delProj = (id: string) => updateResume('projects', resume.projects.filter(p => p.id !== id));

  const addSkill = () => {
    if (!skillInput.trim()) return;
    if (!resume.skills.find(s => s.skill.toLowerCase() === skillInput.trim().toLowerCase())) {
      updateResume('skills', [...resume.skills, { skill: skillInput.trim(), level: skillLevel }]);
    }
    setSkillInput('');
  };
  const removeSkill = (skill: string) => updateResume('skills', resume.skills.filter(s => s.skill !== skill));

  const addCert = () => updateResume('certifications', [...resume.certifications, { name: '', issuer: '', date: '' }]);
  const updateCert = (i: number, field: keyof CertItem, value: string) => {
    const next = [...resume.certifications];
    next[i] = { ...next[i], [field]: value };
    updateResume('certifications', next);
  };
  const delCert = (i: number) => updateResume('certifications', resume.certifications.filter((_, idx) => idx !== i));

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const sectionBtn = (key: string, label: string, icon: typeof FileText) => {
    const Icon = icon;
    const active = activeSection === key;
    return (
      <button
        key={key}
        onClick={() => setActiveSection(key)}
        className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
    );
  };

  const SectionHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
      />
    </div>
  );

  const TextArea = ({ label, value, onChange, placeholder, rows = 3 }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <Check size={14} />
          {toast}
        </div>
      )}

      {/* ── Left Sidebar (Editor) ─────────────────────────────────────────── */}
      <div className="w-[380px] flex-shrink-0 border-r border-white/10 bg-surface-900/50 flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <FileText size={16} className="text-primary-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Resume Builder</h1>
              <p className="text-[11px] text-gray-500">ATS-friendly templates</p>
            </div>
          </div>
          <input
            value={resume.title}
            onChange={e => updateResume('title', e.target.value)}
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500/50"
          />
        </div>

        {/* Section Nav */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          {sectionBtn('personal', 'Personal Info', Type)}
          {sectionBtn('summary', 'Professional Summary', FileText)}
          {sectionBtn('experience', 'Experience', Briefcase)}
          {sectionBtn('education', 'Education', GraduationCap)}
          {sectionBtn('skills', 'Skills', Wrench)}
          {sectionBtn('projects', 'Projects', Folder)}
          {sectionBtn('certifications', 'Certifications', Award)}
          {sectionBtn('design', 'Design & Export', Palette)}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button onClick={saveAll} disabled={saving} className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
          <button onClick={exportPDF} className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2">
            <Download size={15} />
            Export PDF
          </button>
        </div>
      </div>

      {/* ── Middle (Form) ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Personal Info */}
          {activeSection === 'personal' && (
            <div className="space-y-6">
              <SectionHeader title="Personal Information" />

              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="profile" className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Image size={20} className="text-gray-500" />
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                    <Plus size={12} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Profile Photo</p>
                  <p className="text-xs text-gray-500">{uploadingPhoto ? 'Uploading...' : 'Click + to upload'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name" value={profile.full_name} onChange={v => updateProfileField('full_name', v)} placeholder="John Doe" />
                <Field label="Email" value={profile.email} onChange={v => updateProfileField('email', v)} placeholder="john@example.com" type="email" />
                <Field label="Phone" value={profile.phone} onChange={v => updateProfileField('phone', v)} placeholder="+1 555 000 0000" />
                <Field label="Location" value={profile.location} onChange={v => updateProfileField('location', v)} placeholder="San Francisco, CA" />
                <Field label="LinkedIn" value={profile.linkedin} onChange={v => updateProfileField('linkedin', v)} placeholder="linkedin.com/in/john" />
                <Field label="GitHub" value={profile.github} onChange={v => updateProfileField('github', v)} placeholder="github.com/john" />
                <Field label="Portfolio" value={profile.portfolio} onChange={v => updateProfileField('portfolio', v)} placeholder="johndoe.com" />
                <Field label="Website" value={profile.website} onChange={v => updateProfileField('website', v)} placeholder="blog.johndoe.com" />
              </div>
            </div>
          )}

          {/* Summary */}
          {activeSection === 'summary' && (
            <div className="space-y-4">
              <SectionHeader title="Professional Summary">
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary-500/15 text-primary-400 rounded-lg hover:bg-primary-500/25 transition-all disabled:opacity-50"
                >
                  {generatingSummary ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  AI Generate
                </button>
              </SectionHeader>
              <TextArea
                label="Summary"
                value={profile.professional_summary}
                onChange={v => updateProfileField('professional_summary', v)}
                placeholder="A results-driven software engineer with 3+ years of experience..."
                rows={5}
              />
              <p className="text-xs text-gray-500">
                Tip: Keep it under 4 sentences. Focus on your strongest achievements and key technologies.
              </p>
            </div>
          )}

          {/* Experience */}
          {activeSection === 'experience' && (
            <div className="space-y-4">
              <SectionHeader title="Work Experience" />
              {resume.experience.map((exp, idx) => (
                <div key={exp.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-400">Experience {idx + 1}</span>
                    <button onClick={() => delExp(exp.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Company" value={exp.company} onChange={v => updateExp(exp.id, 'company', v)} placeholder="Acme Inc" />
                    <Field label="Role" value={exp.role} onChange={v => updateExp(exp.id, 'role', v)} placeholder="Software Engineer" />
                    <Field label="Start Date" value={exp.startDate} onChange={v => updateExp(exp.id, 'startDate', v)} type="month" />
                    <Field label="End Date" value={exp.endDate} onChange={v => updateExp(exp.id, 'endDate', v)} type="month" />
                  </div>
                  <TextArea label="Description" value={exp.description} onChange={v => updateExp(exp.id, 'description', v)} placeholder="Describe your responsibilities and achievements using action verbs..." rows={4} />
                </div>
              ))}
              <button onClick={addExp} className="w-full py-2.5 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-primary-500/30 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Add Experience
              </button>
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && (
            <div className="space-y-4">
              <SectionHeader title="Education" />
              {resume.education.map((edu, idx) => (
                <div key={edu.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-400">Education {idx + 1}</span>
                    <button onClick={() => delEdu(edu.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Institution" value={edu.institution} onChange={v => updateEdu(edu.id, 'institution', v)} placeholder="Stanford University" />
                    <Field label="Degree" value={edu.degree} onChange={v => updateEdu(edu.id, 'degree', v)} placeholder="Bachelor of Science" />
                    <Field label="Field of Study" value={edu.field} onChange={v => updateEdu(edu.id, 'field', v)} placeholder="Computer Science" />
                    <Field label="GPA" value={edu.gpa} onChange={v => updateEdu(edu.id, 'gpa', v)} placeholder="3.8" />
                    <Field label="Start Date" value={edu.startDate} onChange={v => updateEdu(edu.id, 'startDate', v)} type="month" />
                    <Field label="End Date" value={edu.endDate} onChange={v => updateEdu(edu.id, 'endDate', v)} type="month" />
                  </div>
                </div>
              ))}
              <button onClick={addEdu} className="w-full py-2.5 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-primary-500/30 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Add Education
              </button>
            </div>
          )}

          {/* Skills */}
          {activeSection === 'skills' && (
            <div className="space-y-4">
              <SectionHeader title="Skills" />
              <div className="glass-card p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Field label="Skill" value={skillInput} onChange={setSkillInput} placeholder="e.g. React, Python" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Level</label>
                    <select
                      value={skillLevel}
                      onChange={e => setSkillLevel(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500/50"
                    >
                      {SKILL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addSkill} className="w-full py-2 bg-primary-500/15 text-primary-400 rounded-lg hover:bg-primary-500/25 transition-all text-sm font-medium">
                  Add Skill
                </button>
              </div>
              {resume.skills.length > 0 && (
                <div className="space-y-2">
                  {resume.skills.map(s => (
                    <div key={s.skill} className="flex items-center gap-3 glass-card p-3">
                      <span className="text-sm text-white flex-1">{s.skill}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(s.level / 5) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-20 text-right">{SKILL_LEVELS.find(l => l.value === s.level)?.label}</span>
                      <button onClick={() => removeSkill(s.skill)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {activeSection === 'projects' && (
            <div className="space-y-4">
              <SectionHeader title="Projects" />
              {resume.projects.map((proj, idx) => (
                <div key={proj.id} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-400">Project {idx + 1}</span>
                    <button onClick={() => delProj(proj.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <Field label="Title" value={proj.title} onChange={v => updateProj(proj.id, 'title', v)} placeholder="E-commerce Platform" />
                  <TextArea label="Description" value={proj.description} onChange={v => updateProj(proj.id, 'description', v)} placeholder="Built a full-stack e-commerce platform with React and Node.js..." rows={3} />
                  <Field label="Technologies (comma-separated)" value={proj.technologies.join(', ')} onChange={v => updateProj(proj.id, 'technologies', v.split(',').map(t => t.trim()))} placeholder="React, Node.js, PostgreSQL" />
                  <Field label="Link" value={proj.link} onChange={v => updateProj(proj.id, 'link', v)} placeholder="github.com/john/project" />
                </div>
              ))}
              <button onClick={addProj} className="w-full py-2.5 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-primary-500/30 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Add Project
              </button>
            </div>
          )}

          {/* Certifications */}
          {activeSection === 'certifications' && (
            <div className="space-y-4">
              <SectionHeader title="Certifications" />
              {resume.certifications.map((cert, idx) => (
                <div key={idx} className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-400">Certification {idx + 1}</span>
                    <button onClick={() => delCert(idx)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Name" value={cert.name} onChange={v => updateCert(idx, 'name', v)} placeholder="AWS Solutions Architect" />
                    <Field label="Issuer" value={cert.issuer} onChange={v => updateCert(idx, 'issuer', v)} placeholder="Amazon Web Services" />
                    <Field label="Date" value={cert.date} onChange={v => updateCert(idx, 'date', v)} type="month" />
                  </div>
                </div>
              ))}
              <button onClick={addCert} className="w-full py-2.5 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-primary-500/30 hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-sm">
                <Plus size={16} /> Add Certification
              </button>
            </div>
          )}

          {/* Design */}
          {activeSection === 'design' && (
            <div className="space-y-6">
              <SectionHeader title="Template" />
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => updateResume('template', t.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      resume.template === t.id
                        ? 'border-primary-500/50 bg-primary-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layout size={14} className={resume.template === t.id ? 'text-primary-400' : 'text-gray-500'} />
                      <span className={`text-sm font-semibold ${resume.template === t.id ? 'text-primary-400' : 'text-white'}`}>{t.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </button>
                ))}
              </div>

              <SectionHeader title="Theme" />
              <div className="flex gap-3">
                <button
                  onClick={() => updateResume('theme', 'light')}
                  className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    resume.theme === 'light' ? 'border-primary-500/50 bg-primary-500/10 text-primary-400' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => updateResume('theme', 'dark')}
                  className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    resume.theme === 'dark' ? 'border-primary-500/50 bg-primary-500/10 text-primary-400' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right (Preview) ───────────────────────────────────────────────── */}
      <div className="w-[520px] flex-shrink-0 border-l border-white/10 bg-surface-900/30 flex flex-col h-screen">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-white">Live Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-md ${resume.theme === 'light' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'}`}>
              {resume.template}
            </span>
            <span className={`text-xs px-2 py-1 rounded-md ${resume.theme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'}`}>
              {resume.theme}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div ref={previewRef} className="shadow-2xl">
            <ResumePreview profile={profile} resume={resume} />
          </div>
        </div>
      </div>
    </div>
  );
}

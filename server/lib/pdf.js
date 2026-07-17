/**
 * Resume-to-PDF rendering.
 *
 * Maps resume JSON to a pdfmake document definition. Uses pdfmake (pure-JS)
 * rather than a headless browser to stay within Render's free-tier memory
 * ceiling.
 *
 * This module is a pure transform: no file I/O, no Express dependencies,
 * no pdfmake require. The actual render call (pdfmake.createPdf(...)) lives
 * in the route handler (server/index.js), consistent with the shape of
 * server/lib/cover-letter.js.
 */

/**
 * Build a pdfmake document definition from resume JSON.
 *
 * Section order (matches the resume's existing section order):
 * Name -> Contact -> Summary -> Skills -> Experience -> Projects -> Education
 *
 * @param {object} resumeData - Resume JSON (see .claude/skills/resume-schema/references/schema.md)
 * @returns {object} pdfmake document definition ({ content, styles, defaultStyle })
 */
function buildResumePdfDefinition(resumeData) {
  const {
    name = '',
    contact = {},
    summary = '',
    experience = [],
    projects = [],
    education = [],
    skills = []
  } = resumeData || {}

  const content = []

  // 1. Name
  content.push({ text: name, style: 'name' })

  // 2. Contact line -- only if at least one contact field is non-empty
  const contactParts = [contact.email, contact.github, contact.location].filter(Boolean)
  if (contactParts.length > 0) {
    content.push({ text: contactParts.join(' · '), style: 'contact' })
  }

  // 3. Summary
  if (summary) {
    content.push({ text: 'Summary', style: 'sectionHeader' })
    content.push({ text: summary })
  }

  // 4. Skills
  if (Array.isArray(skills) && skills.length > 0) {
    content.push({ text: 'Skills', style: 'sectionHeader' })
    content.push({ ul: skills })
  }

  // 5. Experience
  if (Array.isArray(experience) && experience.length > 0) {
    content.push({ text: 'Experience', style: 'sectionHeader' })
    for (const exp of experience) {
      const heading = `${exp.company || ''} — ${exp.role || ''} (${exp.period || ''})`
      content.push({ text: heading, style: 'entryHeading' })
      if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
        content.push({ ul: exp.bullets })
      }
    }
  }

  // 6. Projects
  if (Array.isArray(projects) && projects.length > 0) {
    content.push({ text: 'Projects', style: 'sectionHeader' })
    for (const proj of projects) {
      content.push({ text: proj.name || '', style: 'entryHeading' })
      if (proj.description) {
        content.push({ text: proj.description })
      }
      if (Array.isArray(proj.bullets) && proj.bullets.length > 0) {
        content.push({ ul: proj.bullets })
      }
    }
  }

  // 7. Education
  if (Array.isArray(education) && education.length > 0) {
    content.push({ text: 'Education', style: 'sectionHeader' })
    for (const edu of education) {
      content.push({ text: `${edu.degree || ''} — ${edu.school || ''} (${edu.year || ''})` })
    }
  }

  return {
    content,
    styles: {
      name: { fontSize: 20, bold: true },
      contact: { fontSize: 10, color: 'gray', margin: [0, 0, 0, 10] },
      sectionHeader: { fontSize: 13, bold: true, margin: [0, 10, 0, 5] },
      entryHeading: { bold: true, margin: [0, 5, 0, 2] }
    },
    defaultStyle: { font: 'Roboto' }
  }
}

module.exports = { buildResumePdfDefinition }

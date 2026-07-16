/**
 * Resume Schema Validation
 *
 * Validates resume data against the canonical schema (see
 * .claude/skills/resume-schema/references/schema.md). Shared by
 * existing resume routes (PUT /api/resume, POST/PUT /api/resume-library)
 * and the tailored resume patch engine (server/lib/tailor/applyPatches.js).
 *
 * Returns { ok: true } or { ok: false, errors: string[] }.
 */

/**
 * Validate resume data against the canonical schema.
 * @param {object} data - Resume JSON to validate
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
function validateResume(data) {
  const errors = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['Resume must be a JSON object'] }
  }

  // Required top-level fields
  const REQUIRED_FIELDS = ['name', 'contact', 'summary', 'experience', 'projects', 'education', 'skills']
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      errors.push(`Missing top-level field: ${field}`)
    }
  }

  // Type checks for required fields (strengthened per review feedback)
  if ('contact' in data && (typeof data.contact !== 'object' || data.contact === null || Array.isArray(data.contact))) {
    errors.push('contact must be an object')
  }
  if ('summary' in data && typeof data.summary !== 'string') {
    errors.push('summary must be a string')
  }
  if ('experience' in data && !Array.isArray(data.experience)) {
    errors.push('experience must be an array')
  }
  if ('projects' in data && !Array.isArray(data.projects)) {
    errors.push('projects must be an array')
  }
  if ('education' in data && !Array.isArray(data.education)) {
    errors.push('education must be an array')
  }
  if ('skills' in data && !Array.isArray(data.skills)) {
    errors.push('skills must be an array')
  }

  // Validate contact
  if (data.contact && typeof data.contact === 'object' && !Array.isArray(data.contact)) {
    const CONTACT_FIELDS = ['email', 'github', 'location']
    for (const field of CONTACT_FIELDS) {
      if (!(field in data.contact)) {
        errors.push(`Missing contact field: ${field}`)
      }
    }
  }

  // Validate experience entries
  if (Array.isArray(data.experience)) {
    for (let i = 0; i < data.experience.length; i++) {
      const exp = data.experience[i]
      if (!exp || typeof exp !== 'object') {
        errors.push(`experience[${i}]: must be an object`)
        continue
      }
      for (const field of ['company', 'role', 'period', 'bullets']) {
        if (!(field in exp)) {
          errors.push(`experience[${i}]: missing field "${field}"`)
        }
      }
      if (Array.isArray(exp.bullets)) {
        for (let j = 0; j < exp.bullets.length; j++) {
          if (typeof exp.bullets[j] !== 'string') {
            errors.push(`experience[${i}].bullets[${j}]: must be a string`)
          }
        }
      }
    }
  }

  // Validate project entries
  if (Array.isArray(data.projects)) {
    for (let i = 0; i < data.projects.length; i++) {
      const proj = data.projects[i]
      if (!proj || typeof proj !== 'object') {
        errors.push(`projects[${i}]: must be an object`)
        continue
      }
      for (const field of ['name', 'description', 'bullets']) {
        if (!(field in proj)) {
          errors.push(`projects[${i}]: missing field "${field}"`)
        }
      }
      if (Array.isArray(proj.bullets)) {
        for (let j = 0; j < proj.bullets.length; j++) {
          if (typeof proj.bullets[j] !== 'string') {
            errors.push(`projects[${i}].bullets[${j}]: must be a string`)
          }
        }
      }
    }
  }

  // Validate education entries (must NOT have bullets)
  if (Array.isArray(data.education)) {
    for (let i = 0; i < data.education.length; i++) {
      const edu = data.education[i]
      if (!edu || typeof edu !== 'object') {
        errors.push(`education[${i}]: must be an object`)
        continue
      }
      for (const field of ['degree', 'school', 'year']) {
        if (!(field in edu)) {
          errors.push(`education[${i}]: missing field "${field}"`)
        }
      }
      if ('bullets' in edu) {
        errors.push(`education[${i}]: has unexpected field "bullets" (education entries should not have bullets)`)
      }
    }
  }

  // Validate skills is an array of strings
  if (Array.isArray(data.skills)) {
    for (let i = 0; i < data.skills.length; i++) {
      if (typeof data.skills[i] !== 'string') {
        errors.push(`skills[${i}]: must be a string`)
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

module.exports = { validateResume }

/**
 * Default (blank) resume data.
 *
 * Single source of truth for a schema-valid blank resume object, used as
 * the fallback resume when POST /api/resume-library is called with no
 * resume_data (see .claude/skills/resume-schema/SKILL.md Operation 5,
 * "Create a Blank Resume").
 *
 * Mirrors the style of server/lib/validateResume.js -- a single pure
 * function plus module.exports.
 */

/**
 * Build a fresh, schema-valid blank resume object.
 * @returns {object} A new blank resume object (safe to mutate; no shared state)
 */
function defaultResumeData() {
  return {
    name: '',
    contact: { email: '', github: '', location: '' },
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: []
  }
}

module.exports = { defaultResumeData }

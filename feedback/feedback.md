# User Feedback — ApplyTrail

- **How collected:** First-person exploratory test as one end-user, using the local app in a browser via Playwright MCP, plus a quick source/code-quality pass to explain the issues observed.
- **When:** July 5, 2026

## Raw feedback

1. "The dashboard made the product easy to understand right away. I could see my application count, interviews, offers, stale follow-ups, quick actions, and recent applications without needing onboarding. The seeded demo data helped, especially the follow-up reminder."
2. "The workflow gets confusing around 'New Application.' That page only saves a job posting, while the actual application is saved later from the Cover Letter page. After saving a posting, the form clears but there is no redirect, next step, or lasting confirmation, so I was not sure whether I had created an application or just stored a posting."
3. "The resume editor is useful because it supports structured sections, bullets, projects, skills, and education. It also feels risky: the page is very long, remove buttons are close to editable content, and I do not get a resume preview, export, or obvious autosave state while editing."
4. "Resume Library looks like it should support multiple resume versions, but clicking New Resume failed with 'Invalid resume data.' That made the versioning feature feel unfinished even though rename/select/edit controls are visible."
5. "The match analysis screen is a strong idea. The score, matched keywords, missing keywords, and per-section breakdown are easy to scan. But the heuristic analysis missed most of my test posting. A Product Analyst posting mentioning SQL, dashboarding, stakeholder communication, experimentation, product metrics, React, and Python was reduced to only react and sql, so the result felt too narrow for real resume tailoring."
6. "Review Suggestions is close to valuable, but the final action is disabled as 'Generate Tailored Resume (Coming Soon).' Some generated copy is awkward, such as 'Experienced in Sql' and generic bullets like 'Led sql initiatives that improved project delivery and team productivity.' I would need to rewrite suggestions manually before trusting them."
7. "The cover letter generator is simple and fast, and the copy button is useful. The generated paragraph was readable but generic and had grammar issues like 'Northstar Analytics's goals.' It also only used one obvious matched keyword, so it felt more like a starter paragraph than a tailored letter."
8. "Application tracking works for status changes and follow-up flags, but it needs stronger feedback. Updating a status briefly shows an update state, while saving postings/applications often does not move me to the next screen. Date wording is also confusing because rows with different applied dates can show the same 'days since last change' without explaining that the last status-change date is different from the applied date."
9. "The UI is clean and usable on desktop, but the navigation has many top-level items for one job-search workflow. I would expect a clearer path like: add posting, analyze match, review suggestions, generate cover letter, save application, track follow-up."
10. "From a quality standpoint, the app builds successfully, but lint currently fails. The lint config includes generated `client/dist` output, and source files also have issues such as missing prop validation and an unused variable. I also did not find actual test/spec files, so the resume-library creation bug and API/UI contract mismatch are not being caught automatically."

## Themes (what keeps coming up)

- The core concept is useful: one place for resume editing, posting storage, match analysis, cover letters, and application tracking.
- The strongest UX gap is workflow clarity. Users are asked to understand separate concepts for job postings, applications, cover letters, and analysis without enough guidance or handoff between steps.
- Several actions succeed or fail without enough visible feedback, especially saving a posting, saving an application, and creating a resume version.
- The AI/heuristic features are promising but not yet reliable enough to use without careful review.
- Some advertised features are incomplete or broken, especially resume version creation and tailored resume generation.
- Code quality needs cleanup around linting, generated files, API/client contract tests, and coverage for critical workflows.

## Top 3 things to fix

- [ ] Fix the end-to-end application workflow: clarify "job posting" vs "application," add success/next-step states, and make Save Application redirect or visibly link to the created application.
- [ ] Repair Resume Library creation and add tests for resume-library API/client contracts so "New Resume" cannot regress into an "Invalid resume data" failure.
- [ ] Improve analysis and generated writing quality: broaden keyword extraction beyond the technical whitelist, clean up capitalization/grammar, and either complete or hide the disabled tailored-resume generation flow.

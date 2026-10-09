import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PreviewTailored from './PreviewTailored'

function mockFetchSequence(responses) {
  let call = 0
  global.fetch = vi.fn(() => {
    const response = responses[call] || responses[responses.length - 1]
    call += 1
    return Promise.resolve(response)
  })
}

const tailoredResume = {
  name: 'Test Person',
  contact: {},
  experience: [
    { company: 'Existing Corp', role: 'Engineer', period: '2020-2023', bullets: ['Built things'] },
  ],
  projects: [],
  education: [],
  skills: ['JavaScript'],
}

function draftResponse(skipped) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        tailored_resume: tailoredResume,
        validation: { ok: true },
        skipped,
        source_name: 'Base Resume',
        company: 'Acme',
        role: 'Engineer',
        posting_id: null,
      }),
  }
}

describe('PreviewTailored', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders distinct copy for mixed stale-skip reasons in the stale-skips block', async () => {
    mockFetchSequence([
      draftResponse([
        { id: 's1', section: 'experience', type: 'modify', reason: 'current-mismatch' },
        { id: 's2', section: 'experience', type: 'add', reason: 'target-entry-not-found', target_entry: 'Acme Corp' },
      ]),
    ])

    render(
      <MemoryRouter initialEntries={['/analysis/preview?draft=d1']}>
        <PreviewTailored />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/2 accepted suggestions were not applied:/i)).toBeInTheDocument()
    })

    expect(
      screen.getByText(/the resume content it targeted no longer matches exactly\./)
    ).toBeInTheDocument()

    expect(
      screen.getByText(/no entry named "Acme Corp" was found — this was attached to your most recent experience entry instead\./)
    ).toBeInTheDocument()
  })

  it('renders no stale-skips block at all when skipped is empty', async () => {
    mockFetchSequence([draftResponse([])])

    render(
      <MemoryRouter initialEntries={['/analysis/preview?draft=d1']}>
        <PreviewTailored />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Test Person/)).toBeInTheDocument()
    })

    expect(screen.queryByText(/not applied:/i)).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import CreateApplicationModal from './CreateApplicationModal'

const baseProps = {
  mode: 'manual',
  company: 'Acme',
  role: 'Engineer',
  postingText: 'We are looking for a great engineer to join our team.',
  postingId: 'abc123',
  resumeVersionId: 'def456',
  resumeVersionName: 'Acme - Engineer',
  onCancel: vi.fn(),
  onSuccess: vi.fn(),
}

function mockFetchSequence(responses) {
  let call = 0
  global.fetch = vi.fn(() => {
    const response = responses[call] || responses[responses.length - 1]
    call += 1
    return Promise.resolve(response)
  })
}

describe('CreateApplicationModal', () => {
  beforeEach(() => {
    baseProps.onCancel.mockClear()
    baseProps.onSuccess.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.style.overflow = ''
  })

  it('auto-generates a cover letter on mount and shows it once loaded', async () => {
    mockFetchSequence([
      { ok: true, json: () => Promise.resolve({ cover_letter_paragraph: 'Dear Hiring Manager...' }) },
    ])

    render(<CreateApplicationModal {...baseProps} />)

    expect(screen.getByText(/Generating cover letter/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Dear Hiring Manager...')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/generate-cover-letter',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ job_posting_id: 'abc123' }),
      })
    )
  })

  it('falls back to an empty editable field with an inline note when cover-letter generation fails, without blocking Confirm', async () => {
    mockFetchSequence([
      { ok: false, json: () => Promise.resolve({ error: 'boom' }) },
    ])

    render(<CreateApplicationModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Couldn't auto-generate a cover letter/i)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /Confirm & Create Application/i })
    expect(confirmButton).not.toBeDisabled()
  })

  it('only calls POST /api/applications when Confirm is explicitly clicked, and calls onSuccess on 200', async () => {
    mockFetchSequence([
      { ok: true, json: () => Promise.resolve({ cover_letter_paragraph: 'Cover letter body' }) },
      { ok: true, json: () => Promise.resolve({ application: { id: 'app1', company: 'Acme' } }) },
    ])

    render(<CreateApplicationModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Cover letter body')).toBeInTheDocument()
    })

    // Ensure no application POST has fired yet (only the cover-letter GET/POST fired)
    expect(global.fetch).toHaveBeenCalledTimes(1)

    const confirmButton = screen.getByRole('button', { name: /Confirm & Create Application/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(baseProps.onSuccess).toHaveBeenCalledWith({ id: 'app1', company: 'Acme' })
    })

    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/applications',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          job_posting_id: 'abc123',
          resume_version_id: 'def456',
          company: 'Acme',
          role: 'Engineer',
          status: 'drafted',
          cover_letter_paragraph: 'Cover letter body',
        }),
      })
    )
  })

  it('calls onCancel and never POSTs /api/applications on Cancel click, Escape key, or backdrop click', async () => {
    mockFetchSequence([
      { ok: true, json: () => Promise.resolve({ cover_letter_paragraph: 'x' }) },
    ])

    const { container } = render(<CreateApplicationModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('x')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(baseProps.onCancel).toHaveBeenCalledTimes(2)

    const backdrop = container.querySelector('[data-testid="modal-backdrop"]')
    fireEvent.click(backdrop)
    expect(baseProps.onCancel).toHaveBeenCalledTimes(3)

    const applicationsCalls = global.fetch.mock.calls.filter(([url]) => url === '/api/applications')
    expect(applicationsCalls.length).toBe(0)
  })

  it('shows "No job posting text available." when postingText is empty', async () => {
    mockFetchSequence([
      { ok: true, json: () => Promise.resolve({ cover_letter_paragraph: '' }) },
    ])

    render(<CreateApplicationModal {...baseProps} postingText="" />)

    expect(screen.getByText('No job posting text available.')).toBeInTheDocument()
  })
})

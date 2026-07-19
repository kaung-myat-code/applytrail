import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import Resume from './Resume'

const resumeFixture = {
  name: 'Jane Doe',
  contact: { email: 'jane@example.com', github: 'janedoe', location: 'Remote' },
  summary: 'Experienced engineer.',
  experience: [
    { company: 'Acme', role: 'Engineer', period: '2020-2022', bullets: ['Did a thing'] },
  ],
  projects: [],
  education: [],
  skills: ['JavaScript', 'React'],
}

function mockFetchSequence(responses) {
  let call = 0
  global.fetch = vi.fn(() => {
    const response = responses[call] || responses[responses.length - 1]
    call += 1
    return Promise.resolve(response)
  })
}

function renderResume() {
  const router = createMemoryRouter(
    [{ path: '/resume', element: <Resume /> }],
    { initialEntries: ['/resume'] }
  )
  return render(<RouterProvider router={router} />)
}

describe('Resume', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.style.overflow = ''
  })

  it('does not remove the experience entry when window.confirm is cancelled', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderResume()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Remove Experience/i }))

    expect(window.confirm).toHaveBeenCalled()
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument()
  })

  it('removes the experience entry when window.confirm is confirmed', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderResume()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Remove Experience/i }))

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Acme')).not.toBeInTheDocument()
    })
  })

  it('shows no Saved/Unsaved indicator before any edit', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    renderResume()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument()
    expect(screen.queryByText('✓ Saved')).not.toBeInTheDocument()
  })

  it('shows the Unsaved changes indicator after a field edit', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    renderResume()

    const nameInput = await screen.findByDisplayValue('Jane Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })

    expect(screen.getByText('● Unsaved changes')).toBeInTheDocument()
  })

  it('flips to Saved after a successful save, then back to Unsaved after another edit', async () => {
    mockFetchSequence([
      { ok: true, json: () => Promise.resolve(resumeFixture) },
      { ok: true, json: () => Promise.resolve({}) },
    ])

    renderResume()

    const nameInput = await screen.findByDisplayValue('Jane Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })

    expect(screen.getByText('● Unsaved changes')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(screen.getByText('✓ Saved')).toBeInTheDocument()
    })
    expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('Jane Smith'), { target: { value: 'Jane S.' } })

    expect(screen.getByText('● Unsaved changes')).toBeInTheDocument()
    expect(screen.queryByText('✓ Saved')).not.toBeInTheDocument()
  })

  it('opens the Preview modal when "Preview Resume" is clicked', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    renderResume()

    await screen.findByDisplayValue('Jane Doe')

    expect(screen.queryByText('Resume Preview')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Preview Resume/i }))

    expect(screen.getByText('Resume Preview')).toBeInTheDocument()
  })

  it('shows the current unsaved value of an edited field in the Preview modal, not the last-saved value', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    renderResume()

    const nameInput = await screen.findByDisplayValue('Jane Doe')
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } })

    fireEvent.click(screen.getByRole('button', { name: /Preview Resume/i }))

    expect(screen.getByText('Resume Preview')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  it('renders nothing for a zero-entry section (Education) inside the Preview modal', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    const { container } = renderResume()

    await screen.findByDisplayValue('Jane Doe')
    fireEvent.click(screen.getByRole('button', { name: /Preview Resume/i }))

    const dialog = container.querySelector('[data-testid="resume-preview-dialog"]')
    expect(within(dialog).getByText('Resume Preview')).toBeInTheDocument()
    // Education has zero entries in the fixture -- the label must not render inside the modal
    // (the underlying editor form still has its own "Education" section heading, so this
    // assertion is scoped to the modal dialog only).
    expect(within(dialog).queryByText('Education')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Projects')).not.toBeInTheDocument()
  })

  it('dismisses the Preview modal via the Close button', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    renderResume()

    await screen.findByDisplayValue('Jane Doe')
    fireEvent.click(screen.getByRole('button', { name: /Preview Resume/i }))
    expect(screen.getByText('Resume Preview')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Close$/i }))
    expect(screen.queryByText('Resume Preview')).not.toBeInTheDocument()
  })

  it('dismisses the Preview modal via the Escape key', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    renderResume()

    await screen.findByDisplayValue('Jane Doe')
    fireEvent.click(screen.getByRole('button', { name: /Preview Resume/i }))
    expect(screen.getByText('Resume Preview')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('Resume Preview')).not.toBeInTheDocument()
  })

  it('dismisses the Preview modal via a backdrop click', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(resumeFixture) }])

    const { container } = renderResume()

    await screen.findByDisplayValue('Jane Doe')
    fireEvent.click(screen.getByRole('button', { name: /Preview Resume/i }))
    expect(screen.getByText('Resume Preview')).toBeInTheDocument()

    const backdrop = container.querySelector('[data-testid="resume-preview-backdrop"]')
    fireEvent.click(backdrop)
    expect(screen.queryByText('Resume Preview')).not.toBeInTheDocument()
  })
})

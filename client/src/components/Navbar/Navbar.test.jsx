import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

function renderNavbar(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Navbar />
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  it('opens a panel with "Resume" and "Resume Library" links when the "Resume" group label is clicked', () => {
    renderNavbar()

    expect(screen.queryByRole('link', { name: 'Resume' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))

    expect(screen.getByRole('link', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resume Library' })).toBeInTheDocument()
  })

  it('closes the "Resume" panel and opens the "Tailor" panel when "Tailor" is clicked while "Resume" is open (only one open at a time)', () => {
    renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))
    expect(screen.getByRole('link', { name: 'Resume Library' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Tailor/i }))

    expect(screen.queryByRole('link', { name: 'Resume Library' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analysis' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cover Letter' })).toBeInTheDocument()
  })

  it('closes an open group when Escape is pressed', async () => {
    renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))
    expect(screen.getByRole('link', { name: 'Resume Library' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Resume Library' })).not.toBeInTheDocument()
    })
  })

  it('closes an open group when clicking outside the navbar', async () => {
    renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))
    expect(screen.getByRole('link', { name: 'Resume Library' })).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Resume Library' })).not.toBeInTheDocument()
    })
  })

  it('renders "New Application" and "Applications" as plain links with no dropdown trigger, at every point', () => {
    renderNavbar()

    expect(screen.getByRole('link', { name: 'New Application' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /New Application/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Applications/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))

    expect(screen.getByRole('link', { name: 'New Application' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Applications' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /New Application/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Applications/i })).not.toBeInTheDocument()
  })
})

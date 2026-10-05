import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import App from './App'

function renderApp(initialEntry = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <App />,
        children: [
          { index: true, element: <div>Dashboard content</div> },
          { path: 'applications', element: <div>Applications content</div> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  )

  return render(<RouterProvider router={router} />)
}

describe('App shell', () => {
  it('shows the hosted demo safety warning on the root route', () => {
    renderApp()

    const warning = screen.getByRole('alert')

    expect(warning).toHaveTextContent(/unauthenticated/i)
    expect(warning).toHaveTextContent(/shared/i)
    expect(warning).toHaveTextContent(/writable/i)
    expect(warning).toHaveTextContent(/disposable/i)
    expect(warning).toHaveTextContent(/demonstration purposes only/i)
  })

  it('prohibits private job-search data in the warning', () => {
    renderApp()

    const warning = screen.getByRole('alert')

    expect(warning).toHaveTextContent(/real resumes/i)
    expect(warning).toHaveTextContent(/contact information/i)
    expect(warning).toHaveTextContent(/credentials/i)
    expect(warning).toHaveTextContent(/secrets/i)
    expect(warning).toHaveTextContent(/private job-search data/i)
  })

  it('keeps the warning and child content visible on another route', () => {
    renderApp('/applications')

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Applications content')).toBeInTheDocument()
  })
})

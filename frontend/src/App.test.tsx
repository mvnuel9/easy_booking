// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from './App'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('EasyBooking authentication screen', () => {
  it('switches between sign-in and registration forms', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Ravi de vous revoir' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Inscription' }))

    expect(screen.getByRole('heading', { name: 'Créer votre compte' })).toBeTruthy()
    expect(screen.getByLabelText('Nom d’utilisateur')).toBeTruthy()
    expect(screen.getByLabelText('Adresse e-mail')).toBeTruthy()
    expect(screen.getByLabelText('Mot de passe')).toBeTruthy()
  })
})
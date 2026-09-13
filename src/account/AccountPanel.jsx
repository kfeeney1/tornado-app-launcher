import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useCloudProfile } from '../cloud/CloudProfileContext.jsx'
import { normalizeDisplayName, supportsPasswordAuthentication, validateDisplayName, validateEmail, validateNewPassword, validatePassword } from './accountValidation.js'

function FormMessage({ error, message }) {
  if (error) return <div className="auth-message error" role="alert">{error}</div>
  if (message) return <div className="auth-message success" role="status">{message}</div>
  return null
}

export default function AccountPanel() {
  const {
    user,
    signOut,
    resetPassword,
    refreshUser,
    sendVerificationEmail,
    requestEmailChange,
    changePassword,
    deleteAccount,
  } = useAuth()
  const { profile, updateDisplayName } = useCloudProfile()
  const passwordAccount = supportsPasswordAuthentication(user?.providerIds)
  const displayName = profile?.displayName ?? user?.displayName ?? ''
  const [nameValue, setNameValue] = useState(displayName)
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameMessage, setNameMessage] = useState('')
  const [verificationBusy, setVerificationBusy] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [signOutBusy, setSignOutBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [sessionMessage, setSessionMessage] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const providerLabel = useMemo(() => passwordAccount ? 'Email and password' : (user?.providerIds?.join(', ') || 'External sign-in provider'), [passwordAccount, user?.providerIds])

  const saveDisplayName = async event => {
    event.preventDefault()
    const result = validateDisplayName(nameValue)
    if (!result.valid) { setNameError(result.message); return }
    setNameBusy(true); setNameError(''); setNameMessage('')
    try {
      await updateDisplayName(result.value)
      setNameValue(result.value)
      setNameMessage('Display name updated.')
    } catch (error) { setNameError(error.message) }
    finally { setNameBusy(false) }
  }

  const sendVerification = async () => {
    setVerificationBusy(true); setVerificationError(''); setVerificationMessage('')
    try {
      await sendVerificationEmail()
      setVerificationMessage('Verification email sent. Open the link in that email, then refresh your status here.')
    } catch (error) { setVerificationError(error.message) }
    finally { setVerificationBusy(false) }
  }

  const refreshVerification = async () => {
    setVerificationBusy(true); setVerificationError(''); setVerificationMessage('')
    try {
      const refreshed = await refreshUser()
      setVerificationMessage(refreshed?.emailVerified ? 'Email verified.' : 'Your email is still awaiting verification.')
    } catch (error) { setVerificationError(error.message) }
    finally { setVerificationBusy(false) }
  }

  const submitEmail = async event => {
    event.preventDefault()
    const emailResult = validateEmail(newEmail)
    if (!emailResult.valid) { setEmailError(emailResult.message); return }
    const passwordResult = validatePassword(emailPassword)
    if (!passwordResult.valid) { setEmailError('Enter your current password to change email.'); return }
    if (emailResult.value === user?.email?.toLowerCase()) { setEmailError('Enter a different email address.'); return }
    setEmailBusy(true); setEmailError(''); setEmailMessage('')
    try {
      await requestEmailChange(emailPassword, emailResult.value)
      setEmailMessage(`Verification sent to ${emailResult.value}. Your sign-in email will change only after that address is verified.`)
      setNewEmail(''); setEmailPassword('')
    } catch (error) { setEmailError(error.message) }
    finally { setEmailBusy(false) }
  }

  const submitPassword = async event => {
    event.preventDefault()
    const result = validateNewPassword(newPassword, confirmPassword)
    if (!result.valid) { setPasswordError(result.message); return }
    if (!validatePassword(currentPassword).valid) { setPasswordError('Enter your current password.'); return }
    setPasswordBusy(true); setPasswordError(''); setPasswordMessage('')
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMessage('Password changed successfully.')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (error) { setPasswordError(error.message) }
    finally { setPasswordBusy(false) }
  }

  const requestReset = async () => {
    if (!user?.email) return
    setResetBusy(true); setSessionError(''); setSessionMessage('')
    try {
      await resetPassword(user.email)
      setSessionMessage('A password reset email has been requested for your Tornado account.')
    } catch (error) { setSessionError(error.message) }
    finally { setResetBusy(false) }
  }

  const doSignOut = async () => {
    setSignOutBusy(true); setSessionError(''); setSessionMessage('')
    try { await signOut() } catch (error) { setSessionError(error.message); setSignOutBusy(false) }
  }

  const confirmDelete = async event => {
    event.preventDefault()
    if (!navigator.onLine) { setDeleteError('Connect to the internet before deleting your Tornado account.'); return }
    if (passwordAccount && !validatePassword(deletePassword).valid) { setDeleteError('Enter your current password to delete this account.'); return }
    setDeleteBusy(true); setDeleteError('')
    try { await deleteAccount(passwordAccount ? deletePassword : '') }
    catch (error) { setDeleteError(error.message); setDeleteBusy(false) }
  }

  return <>
    <div className="panel account-section">
      <h2>Profile</h2>
      <form onSubmit={saveDisplayName} className="account-form" noValidate>
        <label className="auth-field">
          <span>Display name</span>
          <input value={nameValue} onChange={event => setNameValue(event.target.value)} maxLength="80" autoComplete="name" aria-describedby="display-name-help" />
        </label>
        <p id="display-name-help" className="field-help">Private Tornado profile name. It does not need to be unique.</p>
        <FormMessage error={nameError} message={nameMessage} />
        <button className="secondary-action" disabled={nameBusy}>{nameBusy ? 'Saving…' : 'Save display name'}</button>
      </form>
    </div>

    <div className="panel account-section">
      <h2>Account</h2>
      <dl className="account-details">
        <div><dt>Email</dt><dd>{user?.email || 'No email available'}</dd></div>
        <div><dt>Status</dt><dd>{user?.emailVerified ? 'Verified' : 'Email not verified'}</dd></div>
        <div><dt>Sign-in method</dt><dd>{providerLabel}</dd></div>
      </dl>
      {!user?.emailVerified && <div className="account-inline-actions">
        <button className="secondary-action" onClick={sendVerification} disabled={verificationBusy}>{verificationBusy ? 'Sending…' : 'Send verification email'}</button>
        <button className="text-action inline" onClick={refreshVerification} disabled={verificationBusy}>I&apos;ve verified my email</button>
      </div>}
      <FormMessage error={verificationError} message={verificationMessage} />

      {passwordAccount && <>
        <div className="account-actions">
          <button className="secondary-action" onClick={() => { setShowEmailForm(value => !value); setEmailError(''); setEmailMessage('') }}>Change email</button>
          <button className="secondary-action" onClick={() => { setShowPasswordForm(value => !value); setPasswordError(''); setPasswordMessage('') }}>Change password</button>
        </div>
        {showEmailForm && <form onSubmit={submitEmail} className="account-form compact-form" noValidate>
          <label className="auth-field"><span>New email</span><input type="email" autoComplete="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} /></label>
          <label className="auth-field"><span>Current password</span><input type="password" autoComplete="current-password" value={emailPassword} onChange={event => setEmailPassword(event.target.value)} /></label>
          <FormMessage error={emailError} message={emailMessage} />
          <button className="primary-action fit-action" disabled={emailBusy}>{emailBusy ? 'Sending verification…' : 'Verify new email'}</button>
        </form>}
        {showPasswordForm && <form onSubmit={submitPassword} className="account-form compact-form" noValidate>
          <label className="auth-field"><span>Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
          <label className="auth-field"><span>New password</span><input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
          <label className="auth-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>
          <FormMessage error={passwordError} message={passwordMessage} />
          <button className="primary-action fit-action" disabled={passwordBusy}>{passwordBusy ? 'Changing password…' : 'Change password'}</button>
        </form>}
      </>}
    </div>

    <div className="panel account-section">
      <h2>Session</h2>
      <p>Signing out disconnects account sync and device activity on this client while preserving genuine device-specific settings.</p>
      <FormMessage error={sessionError} message={sessionMessage} />
      <div className="account-actions">
        {passwordAccount && <button className="secondary-action" onClick={requestReset} disabled={resetBusy || signOutBusy}>{resetBusy ? 'Requesting reset…' : 'Send password reset email'}</button>}
        <button className="secondary-action" onClick={doSignOut} disabled={signOutBusy || resetBusy}>{signOutBusy ? 'Signing out…' : 'Sign Out'}</button>
      </div>
    </div>

    <div className="panel danger-zone">
      <h2>Danger zone</h2>
      <p>Deleting your Tornado account permanently removes the account, cloud-synced launcher configuration, profile data and device registry. Device-specific Tornado settings on this device are preserved.</p>
      {!showDelete ? <button className="danger-action" onClick={() => setShowDelete(true)}>Delete Tornado account</button> :
        <form onSubmit={confirmDelete} className="account-form delete-confirmation" noValidate>
          <h3>Delete Tornado account?</h3>
          <p>This cannot be undone. Tornado will return to the signed-out screen after deletion.</p>
          {passwordAccount && <label className="auth-field"><span>Current password</span><input type="password" autoComplete="current-password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} /></label>}
          <FormMessage error={deleteError} message="" />
          <div className="account-actions">
            <button type="button" className="secondary-action" onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteError('') }} disabled={deleteBusy}>Cancel</button>
            <button className="danger-action" disabled={deleteBusy}>{deleteBusy ? 'Deleting account…' : 'Delete account permanently'}</button>
          </div>
        </form>}
    </div>
  </>
}

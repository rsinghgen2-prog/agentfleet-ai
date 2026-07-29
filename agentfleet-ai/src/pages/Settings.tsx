const Settings = () => {
  return (
    <div className="min-h-screen bg-[var(--body-bg)] text-[var(--body-text)] transition-colors duration-300 px-4 py-8">
      <div className="mx-auto max-w-4xl rounded-[32px] bg-[var(--surface)] border border-[var(--border)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition-colors">
        <h1 className="text-3xl font-semibold text-[var(--body-text)]">Settings</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Manage your dental dashboard preferences, profile, and clinic settings.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] bg-[var(--surface-strong)] p-6 shadow-sm transition-colors">
            <h2 className="text-xl font-semibold text-[var(--body-text)]">Profile</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Update your name, contact details, and clinic information.</p>
          </div>
          <div className="rounded-[28px] bg-[var(--surface-strong)] p-6 shadow-sm transition-colors">
            <h2 className="text-xl font-semibold text-[var(--body-text)]">Appearance</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Switch between light and dark mode, customize your dashboard theme, and manage accessibility options.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

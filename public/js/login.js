document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  if (localStorage.getItem('parkSyncAuth')) {
    window.location.href = '/';
  }

  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  const toggleModeBtn = document.getElementById('toggle-mode');
  const formTitle = document.getElementById('form-title');
  const formSubtitle = document.getElementById('form-subtitle');

  let isLoginMode = true;

  toggleModeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    errorBox.classList.add('hidden');
    
    if (isLoginMode) {
      formTitle.textContent = 'Welcome Back';
      formSubtitle.textContent = 'Enter your credentials to access the dashboard';
      submitBtn.innerHTML = 'Sign In <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      toggleModeBtn.textContent = 'Sign up';
      toggleModeBtn.previousSibling.textContent = "Don't have an account? ";
    } else {
      formTitle.textContent = 'Create Account';
      formSubtitle.textContent = 'Register a new account for the dashboard';
      submitBtn.innerHTML = 'Sign Up <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
      toggleModeBtn.textContent = 'Sign in';
      toggleModeBtn.previousSibling.textContent = "Already have an account? ";
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Signing In...';

    try {
      const endpoint = isLoginMode ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success
      if (!isLoginMode) {
        // If registered successfully, automatically log them in by fetching login
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error);
        localStorage.setItem('parkSyncAuth', loginData.token);
        localStorage.setItem('parkSyncUser', JSON.stringify({ username: loginData.username, role: loginData.role }));
        window.location.href = '/';
      } else {
        localStorage.setItem('parkSyncAuth', data.token);
        localStorage.setItem('parkSyncUser', JSON.stringify({ username: data.username, role: data.role || 'Admin' }));
        window.location.href = '/';
      }
      
    } catch (err) {
      errorBox.querySelector('span').textContent = err.message;
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = isLoginMode ? 'Sign In <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' : 'Sign Up <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>';
    }
  });
});

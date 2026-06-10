<template>
  <div class="auth-page">
    <div class="glass-panel card">
      <div class="header">
        <NuxtLink to="/" class="back-link">← กลับไปยังหน้ากรอกรหัส</NuxtLink>
        <h1 class="text-gradient">เข้าสู่ระบบโฮสต์</h1>
        <p class="subtitle">จัดการการนำเสนอและแดชบอร์ดของคุณ</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>อีเมล (Email Address)</label>
          <input
            v-model="email"
            type="email"
            placeholder="name@domain.com"
            class="premium-input"
            required
          />
        </div>

        <div class="form-group">
          <label>รหัสผ่าน (Password)</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="premium-input"
            required
          />
        </div>

        <button type="submit" :disabled="loading" class="btn-primary auth-btn">
          <span v-if="loading">กำลังเข้าสู่ระบบ...</span>
          <span v-else>เข้าสู่ระบบ 🔓</span>
        </button>
      </form>

      <p v-if="error" class="error-msg">{{ error }}</p>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const client = useSupabaseClient()
const router = useRouter()

const swalDark = Swal.mixin({
  customClass: {
    popup: 'glass-panel swal-dark-popup',
    title: 'swal-dark-title',
    htmlContainer: 'swal-dark-html',
    confirmButton: 'btn-primary swal-dark-btn',
    cancelButton: 'btn-secondary swal-dark-btn'
  },
  buttonsStyling: false,
  background: 'rgba(20, 20, 35, 0.95)',
  color: '#f8fafc'
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  const { error: authError } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (authError) {
    loading.value = false
    swalDark.fire({
      title: 'เข้าสู่ระบบไม่สำเร็จ ❌',
      text: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง',
      icon: 'error',
      confirmButtonText: 'ตกลง'
    })
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.card {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-link {
  color: var(--text-secondary);
  font-size: 0.85rem;
  align-self: flex-start;
  transition: var(--transition-smooth);
}

.back-link:hover {
  color: var(--color-secondary);
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.auth-btn {
  margin-top: 10px;
  font-size: 1rem;
}

.error-msg {
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.footer-links {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.link-text {
  color: var(--color-secondary);
  font-weight: 600;
}

.link-text:hover {
  text-decoration: underline;
}
</style>

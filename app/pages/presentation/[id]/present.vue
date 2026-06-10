<template>
  <div v-if="presentation" class="present-page">
    <!-- Animated background glowing nodes -->
    <div class="ambient-glow-bg">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
      <div class="glow-orb orb-4"></div>
      <div class="mysterious-dust dust-1"></div>
      <div class="mysterious-dust dust-2"></div>
      <div class="mysterious-dust dust-3"></div>
      <div class="mysterious-dust dust-4"></div>
      <div class="mysterious-dust dust-5"></div>
      <div class="mysterious-dust dust-6"></div>
    </div>

    <!-- Start Presentation Preparation Overlay (Host Lobby) -->
    <div v-if="showIntroModal" class="welcome-lobby-overlay">
      <div class="glass-panel lobby-card">
        <span class="lobby-icon-badge">🪐</span>
        <h1 class="lobby-title text-gradient">{{ presentation.title }}</h1>
        <p class="lobby-subtitle">กำลังเตรียมพร้อมการนำเสนอแบบโพลสด</p>

        <!-- QR code and Join details -->
        <div class="lobby-join-panel">
          <div class="lobby-qr-box">
            <div class="qr-border-box">
              <img
                :src="`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl + '/p/' + presentation.join_code.replace(/\s+/g, ''))}&color=147-51-234&bgcolor=9-9-14`"
                alt="QR Code"
                class="qr-code-image"
              />
            </div>
            <p class="lobby-qr-hint">📱 สแกนเพื่อเข้าร่วมเลยทันที</p>
          </div>

          <h3 class="lobby-join-heading">วิธีการเข้าร่วมห้อง:</h3>
          <div class="lobby-join-details">
            <div class="join-detail-row">
              <span class="join-detail-step">1</span>
              <span class="join-detail-label">ไปที่เว็บไซต์</span>
              <span class="lobby-link">{{ joinUrlDisplay }}</span>
              <button
                type="button"
                class="copy-icon-btn"
                :class="{ copied: copiedField === 'url' }"
                :title="copiedField === 'url' ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์เว็บไซต์'"
                @click="copyToClipboard(joinUrlDisplay, 'url')"
              >
                <svg v-if="copiedField !== 'url'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
            </div>
            <div class="join-detail-row">
              <span class="join-detail-step">2</span>
              <span class="join-detail-label">กรอกรหัสห้อง</span>
              <span class="lobby-code-badge">{{ presentation.join_code }}</span>
              <button
                type="button"
                class="copy-icon-btn"
                :class="{ copied: copiedField === 'code' }"
                :title="copiedField === 'code' ? 'คัดลอกแล้ว!' : 'คัดลอกรหัสห้อง'"
                @click="copyToClipboard(presentation.join_code.replace(/\s+/g, ''), 'code')"
              >
                <svg v-if="copiedField !== 'code'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Music Select Setup -->
        <div class="lobby-music-setup glass-panel">
          <h3>🎵 ตั้งค่าเสียงเพลงบรรเลงประกอบ</h3>
          <div class="music-controls-row">
            <div class="lobby-control-group lobby-track-group">
              <span class="lobby-control-label">เพลง</span>
              <select v-model="selectedTrack" @change="previewTrack" class="lobby-select">
                <option value="">ปิดเพลงบรรเลง</option>
                <option v-for="t in musicTracks" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div class="lobby-control-group lobby-volume-group">
              <span class="vol-icon">🔊</span>
              <input
                v-model="audioVolume"
                type="range"
                min="0"
                max="1"
                step="0.1"
                @input="handleVolumeChange"
                class="lobby-volume-slider"
                title="ปรับระดับเสียง"
              />
            </div>
            <button @click="togglePreviewPlay" class="btn-secondary play-preview-btn">
              {{ isPreviewPlaying ? '⏸️ หยุดทดลองฟัง' : '▶️ ทดลองฟัง' }}
            </button>
          </div>
        </div>

        <!-- Registered Players lobby grid -->
        <div class="lobby-players-section">
          <h3>👥 ผู้ที่เข้าร่วมห้องแล้ว ({{ participants.length }} คน):</h3>
          <div class="lobby-players-grid">
            <div v-for="p in participants" :key="p.id" class="participant-bubble">
              <span class="p-emoji">{{ p.emoji }}</span>
              <span class="p-nick">{{ p.nickname }}</span>
            </div>
            <div v-if="participants.length === 0" class="no-players-hint">
              กำลังรอผู้เล่นสแกนเข้าร่วมห้อง...
            </div>
          </div>
        </div>

        <button @click="startPresentation" class="btn-primary start-lobby-btn">
          เริ่มนำเสนอสด 🚀
        </button>
      </div>
    </div>

    <!-- Quiz Leaderboard Overlay -->
    <div v-if="showLeaderboard" class="modal-overlay" @click="showLeaderboard = false">
      <div class="glass-panel leaderboard-card" @click.stop>
        <h2 class="lb-title">🏆 อันดับ Quiz</h2>
        <p class="lb-subtitle">ตอบถูก + เร็วที่สุด = อันดับสูงสุด</p>
        <div class="lb-list">
          <div v-if="quizLeaderboard.length === 0" class="lb-empty">
            <span>😶</span>
            <p>ยังไม่มีผู้ตอบถูกในรอบนี้</p>
          </div>
          <div
            v-for="(entry, idx) in quizLeaderboard"
            :key="entry.session_id"
            :class="['lb-row', `rank-${idx + 1}`]"
          >
            <span class="lb-rank">{{ ['🥇','🥈','🥉'][idx] || `${idx + 1}.` }}</span>
            <span class="lb-avatar">{{ entry.emoji }}</span>
            <span class="lb-name">{{ entry.nickname }}</span>
            <span class="lb-speed">⚡ {{ entry.seconds }}s</span>
          </div>
        </div>
        <button @click="showLeaderboard = false" class="btn-primary lb-close-btn">ปิด</button>
      </div>
    </div>

    <!-- Q&A Spotlight Overlay -->
    <div v-if="spotlightQuestion" class="modal-overlay spotlight-overlay" @click="spotlightQuestion = null">
      <div class="spotlight-card glass-panel" @click.stop>
        <span class="spotlight-badge">💬 Spotlight คำถาม</span>
        <p class="spotlight-text">{{ spotlightQuestion.text }}</p>
        <div class="spotlight-meta">
          <span class="spotlight-votes">👍 {{ spotlightQuestion.upvotes }} โหวต</span>
        </div>
        <button @click="toggleAnswered(spotlightQuestion.id); spotlightQuestion = null" class="btn-primary">
          ✓ ตอบแล้ว — ปิด Spotlight
        </button>
        <button @click="spotlightQuestion = null" class="btn-secondary spotlight-close-only">ปิดแต่ยังไม่ตอบ</button>
      </div>
    </div>

    <!-- QR Code Modal (overlay) -->
    <div v-if="showQRModal" class="modal-overlay" @click="showQRModal = false">
      <div class="glass-panel qr-card" @click.stop>
        <h2>เข้าร่วมการนำเสนอ!</h2>
        <p class="qr-desc">สแกนหรือเข้าไปที่ลิงก์ด้านล่างนี้</p>
        <div class="qr-code-placeholder">
          <div class="qr-border-box">
            <img
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullJoinLink)}&color=147-51-234&bgcolor=9-9-14`"
              alt="QR Code"
              class="qr-code-image"
            />
          </div>
        </div>
        <div class="qr-link-row">
          <a class="qr-link-text" :href="fullJoinLink" target="_blank">{{ fullJoinLink }}</a>
          <button
            type="button"
            class="copy-icon-btn"
            :class="{ copied: copiedField === 'qrlink' }"
            :title="copiedField === 'qrlink' ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์เข้าร่วม'"
            @click="copyToClipboard(fullJoinLink, 'qrlink')"
          >
            <svg v-if="copiedField !== 'qrlink'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </div>
        <button @click="showQRModal = false" class="btn-primary">ปิด</button>
      </div>
    </div>

    <!-- Audio element for background music -->
    <audio ref="audioRef" loop></audio>

    <!-- Active Presentation Area -->
    <div class="present-container">
      <header class="present-header">
        <div class="join-prompt" @click="showQRModal = true">
          <span>เข้าเว็บ <strong>{{ joinUrlDisplay }}</strong></span>
          <span class="join-code-badge">{{ presentation.join_code }}</span>
        </div>
        <div v-if="currentSlide" class="header-question-wrapper">
          <h1 class="slide-question">{{ currentSlide.question }}</h1>
        </div>
        <div class="header-right-meta">
          <span class="active-players-badge">👥 {{ participants.length }}</span>
          <h2 class="pres-title-watermark">{{ presentation.title }}</h2>
        </div>
      </header>

      <!-- Slide content visualizer -->
      <main class="slide-canvas">
        <Transition name="slide-fade" mode="out-in">
          <div v-if="currentSlide" :key="currentSlide.id" class="slide-content">
            <!-- Timer countdown overlay on top of slide -->
            <div v-if="timeLeft > 0" :class="['presenter-timer', { 'timer-warn': timeLeft <= 5 }]">
              <span class="timer-tick-icon">⏱️</span>
              <span class="timer-secs">{{ timeLeft }}</span>
            </div>

            <!-- 1. MULTIPLE CHOICE RESULTS -->
            <div v-if="currentSlide.type === 'multiple_choice'" class="results-container multiple-choice">
              <div v-if="showResults" class="chart-bars">
                <div v-for="opt in mcChartData" :key="opt.id" class="chart-bar-column">
                  <div class="bar-value">{{ opt.count }}</div>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      :style="{ height: `${opt.percent}%`, background: opt.color }"
                    ></div>
                  </div>
                  <div class="bar-label">{{ opt.text }}</div>
                </div>
              </div>
              <div v-else class="results-hidden">
                <span class="eye-icon">👁️‍🗨️</span>
                <p>ผลลัพธ์ถูกซ่อนอยู่ กด 'S' หรือคลิกปุ่มแสดงเพื่อเปิดเผย</p>
              </div>
            </div>

            <!-- 2. QUIZ RESULTS -->
            <div v-else-if="currentSlide.type === 'quiz'" :class="['results-container', 'quiz', { 'quiz-flash': quizRevealFlash }]">
              <!-- Reveal flash overlay -->
              <div v-if="quizRevealFlash" class="quiz-reveal-flash"></div>

              <div v-if="showResults" class="chart-bars">
                <div
                  v-for="opt in quizChartData"
                  :key="opt.id"
                  :class="['chart-bar-column', { 'correct-column': revealQuizAnswer && opt.isCorrect, 'wrong-column': revealQuizAnswer && !opt.isCorrect }]"
                >
                  <div class="bar-value">{{ opt.count }}</div>
                  <div class="bar-track">
                    <div
                      class="bar-fill"
                      :style="{
                        height: `${opt.percent}%`,
                        background: revealQuizAnswer && opt.isCorrect ? 'var(--color-success)' : revealQuizAnswer ? 'rgba(239,68,68,0.35)' : opt.color
                      }"
                    ></div>
                  </div>
                  <div class="bar-label" :class="{ 'correct-label': revealQuizAnswer && opt.isCorrect, 'wrong-label': revealQuizAnswer && !opt.isCorrect }">
                    <span v-if="revealQuizAnswer && opt.isCorrect">✅ </span>
                    <span v-else-if="revealQuizAnswer && !opt.isCorrect">❌ </span>
                    {{ opt.text }}
                  </div>
                </div>
              </div>
              <div v-else class="results-hidden">
                <span class="eye-icon">🏆</span>
                <p>ผู้เข้าร่วมกำลังส่งคำตอบ...</p>
              </div>
            </div>

            <!-- 3. WORD CLOUD RESULTS -->
            <div v-else-if="currentSlide.type === 'word_cloud'" :class="['results-container', 'word-cloud', { 'inspecting-active': isInspecting, 'resolved-winner': revealWinner }]">
              <div v-if="wordCloudData.length === 0" class="empty-cloud">
                <p>กำลังรอผลการตอบกลับ...</p>
              </div>
              <div v-else class="cloud-wrapper">
                <span v-for="item in wordCloudData" :key="item.text" class="cloud-word-wrapper">
                  <span
                    :class="[
                      'cloud-word',
                      {
                        'largest-word': item.isLargest,
                        'winner-highlight': revealWinner && item.isLargest,
                        'loser-dim': revealWinner && !item.isLargest
                      }
                    ]"
                    :style="{
                      fontSize: `${Math.max(1.4, Math.min(6.5, 1.2 + item.weight * 0.95))}rem`,
                      color: item.color,
                      animationDelay: `${Math.random() * 2}s`
                    }"
                  >
                    {{ item.text }}
                  </span>
                  <button class="cloud-word-delete" title="ลบคำนี้ออกจากผลลัพธ์" @click="deleteWordCloudWord(item)">
                    ✕
                  </button>
                </span>
              </div>
            </div>

            <!-- 4. Q&A RESULTS -->
            <div v-else-if="currentSlide.type === 'q_and_a'" class="results-container qa">
              <div v-if="qaQuestions.length === 0" class="empty-qa">
                <span class="icon">💬</span>
                <p>ยังไม่มีคำถามจากผู้ฟังในขณะนี้</p>
              </div>
              <div v-else class="qa-grid">
                <div
                  v-for="q in qaQuestions"
                  :key="q.id"
                  :class="['qa-card', 'glass-panel', { answered: q.isAnswered, spotlight: spotlightQuestion && spotlightQuestion.id === q.id }]"
                >
                  <div class="qa-upvote-badge">👍 {{ q.upvotes }}</div>
                  <p class="qa-content">{{ q.text }}</p>
                  <div class="qa-footer">
                    <span class="qa-time">👤 นิรนาม</span>
                    <div class="qa-actions">
                      <button @click="spotlightQuestion = q" class="btn-qa-action btn-qa-spotlight" title="Spotlight คำถามนี้">
                        🔍
                      </button>
                      <button @click="toggleAnswered(q.id)" class="btn-qa-action">
                        {{ q.isAnswered ? 'กู้คืน' : '✓ ตอบแล้ว' }}
                      </button>
                      <button @click="deleteQAQuestion(q.id)" class="btn-qa-action btn-qa-delete" title="ลบคำถามนี้">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-canvas">
            <p>ไม่มีสไลด์ในการนำเสนอนี้</p>
          </div>
        </Transition>
      </main>

      <!-- Bottom Control Bar (Hiding automatically, showing on hover) -->
      <footer class="control-bar glass-panel">
        <div class="control-left">
          <button @click="exitPresentation" class="control-btn" title="ออกจากการนำเสนอ">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
          <span class="slide-counter">{{ currentSlideIndex + 1 }} / {{ slides.length }}</span>
        </div>

        <div class="control-center">
          <button @click="prevSlide" :disabled="currentSlideIndex === 0" class="control-btn" title="สไลด์ก่อนหน้า">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button @click="toggleResults" class="control-btn results-toggle" :title="showResults ? 'ซ่อนผลลัพธ์' : 'แสดงผลลัพธ์'">
            <svg v-if="showResults" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          </button>
          
          <!-- Magic Wand Word Cloud Shuffle/Winner Inspect Button -->
          <button v-if="currentSlide?.type === 'word_cloud'" @click="triggerInspection" :disabled="wordCloudData.length === 0 || isInspecting" class="control-btn inspect-toggle" title="สุ่มวิเคราะห์คำโหวตเด่นสุด 🪄">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m21 3-9 9M19 9l2-2M15 5l2-2M19 5l-2 2M9 11l-6 6v3h3l6-6"/></svg>
          </button>

          <button v-if="currentSlide?.type === 'quiz'" @click="toggleQuizAnswer" class="control-btn quiz-toggle" :title="revealQuizAnswer ? 'ซ่อนคำตอบเฉลย' : 'เฉลยคำตอบ'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </button>

          <button v-if="currentSlide?.type === 'quiz'" @click="showLeaderboard = true" class="control-btn leaderboard-toggle" title="ดูอันดับ Leaderboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </button>
          <button @click="nextSlide" :disabled="currentSlideIndex === slides.length - 1" class="control-btn" title="สไลด์ถัดไป">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <div class="control-right">
          <!-- Music controller -->
          <div class="music-controller glass-panel">
            <span class="music-icon" :class="{ rotating: isPlaying }">🎵</span>
            <select v-model="selectedTrack" @change="handleTrackChange" class="music-select">
              <option value="">ปิดเพลง</option>
              <option v-for="t in musicTracks" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <input
              v-model="audioVolume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              @input="handleVolumeChange"
              class="volume-slider"
              title="ความดัง"
            />
          </div>
          <button @click="resetVotes" class="control-btn reset-btn" title="รีเซ็ตผลโหวต">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
          <button @click="showQRModal = true" class="control-btn qr-btn" title="สแกน QR Code / แสดงรหัสเข้าห้อง">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import confetti from 'canvas-confetti'
import Swal from 'sweetalert2'

const client = useSupabaseClient()
const route = useRoute()
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

const presentation = ref(null)
const slides = ref([])
const currentSlideIndex = ref(0)
const responses = ref([])
const participants = ref([])

const showResults = ref(true)
const revealQuizAnswer = ref(false)
const quizRevealFlash = ref(false)
const showQRModal = ref(false)
const showIntroModal = ref(true)
const showLeaderboard = ref(false)
const spotlightQuestion = ref(null)
const isInspecting = ref(false)
const revealWinner = ref(false)

const joinUrl = ref('')
const copiedField = ref('')
let realtimeChannel = null
let participantsChannel = null

const joinUrlDisplay = computed(() => joinUrl.value.replace('http://', '').replace('https://', ''))

const fullJoinLink = computed(() => {
  if (!presentation.value) return ''
  return `${joinUrl.value}/p/${presentation.value.join_code.replace(/\s+/g, '')}`
})

const copyToClipboard = async (text, field) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = field
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = ''
    }, 1500)
  } catch (err) {
    console.log('Copy to clipboard failed:', err)
  }
}

const currentSlide = computed(() => {
  return slides.value[currentSlideIndex.value] || null
})

// Audio Background Music State
const audioRef = ref(null)
const selectedTrack = ref('')
const audioVolume = ref(0.4)
const isPlaying = ref(false)
const isPreviewPlaying = ref(false)

const musicTracks = [
  { id: 'track1', name: '🌅 Chasing the Golden Hour', url: '/music/chasing-the-golden-hour.mp3' },
  { id: 'track2', name: '⏱️ The Final Second', url: '/music/the-final-second.mp3' },
  { id: 'track3', name: '🏔️ The Last Ridge', url: '/music/the-last-ridge.mp3' },
  { id: 'track4', name: '🏠 The Long Ascent Home', url: '/music/the-long-ascent-home.mp3' }
]

// Slide Countdown Timer state
const timeLeft = ref(0)
const timerExpired = ref(false)
let timerInterval = null

const previewTrack = () => {
  if (!audioRef.value) return
  const track = musicTracks.find(t => t.id === selectedTrack.value)
  if (track) {
    audioRef.value.src = track.url
    audioRef.value.volume = audioVolume.value
    audioRef.value.play().then(() => {
      isPlaying.value = true
      isPreviewPlaying.value = true
    }).catch(err => {
      console.log('Autoplay blocked preview:', err)
    })
  } else {
    audioRef.value.src = ''
    isPlaying.value = false
    isPreviewPlaying.value = false
  }
}

const togglePreviewPlay = () => {
  if (!audioRef.value) return
  if (isPreviewPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
    isPreviewPlaying.value = false
  } else {
    previewTrack()
  }
}

const handleTrackChange = () => {
  if (!audioRef.value) return
  const track = musicTracks.find(t => t.id === selectedTrack.value)
  if (track) {
    audioRef.value.src = track.url
    audioRef.value.volume = audioVolume.value
    audioRef.value.play().then(() => {
      isPlaying.value = true
    }).catch(err => {
      console.log('Audio autoplay blocked, waiting for click.')
      isPlaying.value = false
    })
  } else {
    audioRef.value.src = ''
    isPlaying.value = false
  }
}

const handleVolumeChange = () => {
  if (!audioRef.value) return
  audioRef.value.volume = audioVolume.value
}

// Lifecycle Hooks
onMounted(async () => {
  joinUrl.value = window.location.origin

  // Fetch Presentation
  const { data: pres, error: presError } = await client
    .from('presentations')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (presError || !pres) {
    router.push('/dashboard')
    return
  }
  presentation.value = pres
  currentSlideIndex.value = pres.current_slide_index

  // Fetch Slides
  const { data: sldData } = await client
    .from('slides')
    .select('*')
    .eq('presentation_id', pres.id)
    .order('position', { ascending: true })

  if (sldData) {
    slides.value = sldData
    if (sldData.length > 0) {
      subscribeToResponses()
    }
  }

  // Fetch initial participants list
  await fetchParticipants()
  subscribeToParticipants()

  // Bind Keyboard Shortcut keys
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeyDown)
  if (presentation.value) {
    // Mark presentation as Inactive on exit
    await client.from('presentations').update({ is_active: false }).eq('id', presentation.value.id)
  }
  cleanupRealtime()
  if (timerInterval) clearInterval(timerInterval)
})

const handleKeyDown = (e) => {
  if (e.key === 'ArrowRight' || e.key === 'Space') {
    nextSlide()
  } else if (e.key === 'ArrowLeft') {
    prevSlide()
  } else if (e.key === 's' || e.key === 'S') {
    toggleResults()
  } else if (e.key === 'a' || e.key === 'A') {
    toggleQuizAnswer()
  }
}

const syncTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  const limit = currentSlide.value?.settings?.timer_limit || 0
  if (limit > 0 && presentation.value?.slide_started_at) {
    const slideStartedAt = new Date(presentation.value.slide_started_at)
    const now = new Date()
    const elapsedSeconds = Math.floor((now - slideStartedAt) / 1000)
    timeLeft.value = Math.max(0, limit - elapsedSeconds)

    if (timeLeft.value > 0) {
      timerExpired.value = false
      timerInterval = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) {
          clearInterval(timerInterval)
          timerExpired.value = true
          showResults.value = true // Auto reveal
          if (currentSlide.value?.type === 'quiz') {
            revealQuizAnswer.value = true
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            })
          }
        }
      }, 1000)
    } else {
      timerExpired.value = true
      showResults.value = true
    }
  } else {
    timeLeft.value = 0
    timerExpired.value = false
  }
}

// Watch for slide index change to update subscription
watch(currentSlideIndex, () => {
  revealQuizAnswer.value = false
  isInspecting.value = false
  revealWinner.value = false
  subscribeToResponses()
  if (!showIntroModal.value) {
    syncTimer()
  }
})

// Fetch Lobby Participants
const fetchParticipants = async () => {
  if (!presentation.value) return
  const { data } = await client
    .from('participants')
    .select('*')
    .eq('presentation_id', presentation.value.id)
  
  participants.value = data || []
}

// Subscribe to participants changes
const subscribeToParticipants = () => {
  if (!presentation.value) return
  participantsChannel = client
    .channel(`participants-lobby-${presentation.value.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `presentation_id=eq.${presentation.value.id}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          if (!participants.value.some(p => p.id === payload.new.id)) {
            participants.value.push(payload.new)
          }
        } else if (payload.eventType === 'DELETE') {
          participants.value = participants.value.filter(p => p.id !== payload.old.id)
        }
      }
    )
    .subscribe()
}

// Host Lobby Start presentation trigger
const startPresentation = async () => {
  if (audioRef.value && selectedTrack.value) {
    const track = musicTracks.find(t => t.id === selectedTrack.value)
    if (track) {
      audioRef.value.src = track.url
      audioRef.value.volume = audioVolume.value
      audioRef.value.loop = true
      audioRef.value.play().then(() => {
        isPlaying.value = true
      }).catch(e => console.log('Autoplay issue:', e))
    }
  }

  showIntroModal.value = false
  isPreviewPlaying.value = false

  const nowISO = new Date().toISOString()
  await client
    .from('presentations')
    .update({ 
      is_active: true,
      slide_started_at: nowISO
    })
    .eq('id', presentation.value.id)

  if (presentation.value) {
    presentation.value.slide_started_at = nowISO
  }

  syncTimer()
}

// Supabase Realtime Subscription
const subscribeToResponses = async () => {
  cleanupRealtime()
  if (!currentSlide.value) return

  const slideId = currentSlide.value.id

  // Load existing responses
  const { data: existing } = await client
    .from('responses')
    .select('*')
    .eq('slide_id', slideId)

  responses.value = existing || []

  // Subscribe to new insertions
  realtimeChannel = client
    .channel(`realtime-responses-${slideId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `slide_id=eq.${slideId}`
      },
      (payload) => {
        responses.value.push(payload.new)
      }
    )
    .subscribe()
}

const cleanupRealtime = () => {
  if (realtimeChannel) {
    client.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

// Slide Navigation
const nextSlide = async () => {
  if (currentSlideIndex.value < slides.value.length - 1) {
    currentSlideIndex.value++
    revealQuizAnswer.value = false
    spotlightQuestion.value = null
    const nowISO = new Date().toISOString()
    await client
      .from('presentations')
      .update({
        current_slide_index: currentSlideIndex.value,
        slide_started_at: nowISO,
        quiz_reveal_slide_id: null
      })
      .eq('id', presentation.value.id)

    if (presentation.value) {
      presentation.value.slide_started_at = nowISO
    }
  }
}

const prevSlide = async () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
    revealQuizAnswer.value = false
    spotlightQuestion.value = null
    const nowISO = new Date().toISOString()
    await client
      .from('presentations')
      .update({
        current_slide_index: currentSlideIndex.value,
        slide_started_at: nowISO,
        quiz_reveal_slide_id: null
      })
      .eq('id', presentation.value.id)

    if (presentation.value) {
      presentation.value.slide_started_at = nowISO
    }
  }
}

const toggleResults = () => {
  showResults.value = !showResults.value
}

const toggleQuizAnswer = async () => {
  revealQuizAnswer.value = !revealQuizAnswer.value

  await client
    .from('presentations')
    .update({ quiz_reveal_slide_id: revealQuizAnswer.value ? currentSlide.value?.id : null })
    .eq('id', presentation.value.id)

  if (revealQuizAnswer.value) {
    quizRevealFlash.value = true
    setTimeout(() => { quizRevealFlash.value = false }, 700)

    confetti({ particleCount: 200, spread: 100, origin: { y: 0.55 } })
    setTimeout(() => {
      confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.6 } })
      confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 } })
    }, 300)
  }
}

const exitPresentation = () => {
  router.push(`/presentation/${presentation.value.id}/edit`)
}

const resetVotes = async () => {
  const result = await swalDark.fire({
    title: 'รีเซ็ตข้อมูลห้อง?',
    text: 'ผลการส่งคำตอบและผู้เล่นที่ลงทะเบียนจะถูกลบออกทั้งหมด',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, รีเซ็ตห้องเลย! 🔄',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  })

  if (result.isConfirmed) {
    if (!currentSlide.value) return

    await client.from('responses').delete().eq('slide_id', currentSlide.value.id)
    await client.from('participants').delete().eq('presentation_id', presentation.value.id)
    const nowISO = new Date().toISOString()
    await client.from('presentations').update({
      quiz_reveal_slide_id: null,
      slide_started_at: nowISO
    }).eq('id', presentation.value.id)
    if (presentation.value) presentation.value.slide_started_at = nowISO

    responses.value = []
    participants.value = []
    revealQuizAnswer.value = false
    spotlightQuestion.value = null

    swalDark.fire({
      title: 'รีเซ็ตสำเร็จ!',
      text: 'ลบผู้เล่นและผลโหวตในสไลด์นี้เรียบร้อยแล้ว',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

// Q&A Question toggles
const toggleAnswered = async (qaId) => {
  const resp = responses.value.find(r => r.response_value.id === qaId)
  if (resp) {
    resp.response_value.isAnswered = !resp.response_value.isAnswered
    await client
      .from('responses')
      .update({ response_value: resp.response_value })
      .eq('id', resp.id)
  }
}

// Delete a single Q&A question
const deleteQAQuestion = async (qaId) => {
  const resp = responses.value.find(r => r.response_value?.id === qaId)
  if (!resp) return

  const result = await swalDark.fire({
    title: 'ลบคำถามนี้?',
    text: 'คำถามนี้จะถูกลบออกจากหน้าจออย่างถาวร',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย 🗑️',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  })
  if (!result.isConfirmed) return

  const { error } = await client.from('responses').delete().eq('id', resp.id)
  if (!error) {
    responses.value = responses.value.filter(r => r.id !== resp.id)
  }
}

// Delete every response that contributed to a single word cloud entry
const deleteWordCloudWord = async (word) => {
  const result = await swalDark.fire({
    title: `ลบคำว่า "${word.text}"?`,
    text: `คำตอบทั้งหมดที่ตรงกับคำนี้ (${word.weight} รายการ) จะถูกลบออกอย่างถาวร`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ใช่, ลบเลย 🗑️',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true
  })
  if (!result.isConfirmed) return

  const lower = word.text.toLowerCase()
  const matchingIds = responses.value
    .filter(r => (r.response_value?.text || '').trim().substring(0, 25).toLowerCase() === lower)
    .map(r => r.id)

  if (matchingIds.length === 0) return

  const { error } = await client.from('responses').delete().in('id', matchingIds)
  if (!error) {
    responses.value = responses.value.filter(r => !matchingIds.includes(r.id))
  }
}

const triggerInspection = () => {
  if (isInspecting.value || wordCloudData.value.length === 0) return
  isInspecting.value = true
  revealWinner.value = false

  setTimeout(() => {
    isInspecting.value = false
    revealWinner.value = true

    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 }
    })

    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.6 } })
      confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } })
    }, 250)
  }, 3000)
}

// Calculations for Charts/Word Cloud
const colors = ['#9333ea', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444']

const mcChartData = computed(() => {
  if (!currentSlide.value || !currentSlide.value.options) return []
  const opts = currentSlide.value.options

  // Count votes
  const voteCounts = {}
  opts.forEach(o => { voteCounts[o.id] = 0 })

  responses.value.forEach(r => {
    const selectedId = r.response_value?.selected_option_id
    if (selectedId && voteCounts[selectedId] !== undefined) {
      voteCounts[selectedId]++
    }
  })

  const total = Object.values(voteCounts).reduce((a, b) => a + b, 0)

  return opts.map((o, idx) => {
    const count = voteCounts[o.id]
    const percent = total > 0 ? (count / total) * 100 : 0
    return {
      id: o.id,
      text: o.text,
      count,
      percent,
      color: colors[idx % colors.length]
    }
  })
})

const quizChartData = computed(() => {
  return mcChartData.value.map(opt => {
    const originalOpt = currentSlide.value.options.find(o => o.id === opt.id)
    return {
      ...opt,
      isCorrect: originalOpt?.isCorrect || false
    }
  })
})

const wordCloudData = computed(() => {
  if (responses.value.length === 0) return []

  const wordsMap = {}
  responses.value.forEach(r => {
    const text = r.response_value?.text
    if (text) {
      const clean = text.trim().substring(0, 25)
      const lower = clean.toLowerCase()
      if (wordsMap[lower]) {
        wordsMap[lower].weight++
      } else {
        // Stable custom colors based on text hashing (cyan, sky-blue, indigo, purple, teal, white)
        let hash = 0
        for (let i = 0; i < clean.length; i++) {
          hash = clean.charCodeAt(i) + ((hash << 5) - hash)
        }
        const cloudColors = ['#38bdf8', '#0ea5e9', '#06b6d4', '#22d3ee', '#818cf8', '#a78bfa', '#c084fc', '#2dd4bf', '#f8fafc']
        const color = cloudColors[Math.abs(hash) % cloudColors.length]

        wordsMap[lower] = { 
          text: clean, 
          weight: 1, 
          color
        }
      }
    }
  })

  // Sort descending by weight
  const sortedWords = Object.values(wordsMap).sort((a, b) => b.weight - a.weight)

  // Stagger items to center the largest word (W1 in the center)
  const centeredWords = []
  sortedWords.forEach((word, idx) => {
    if (idx === 0) {
      centeredWords.push(word)
    } else if (idx % 2 === 1) {
      centeredWords.unshift(word)
    } else {
      centeredWords.push(word)
    }
  })

  // Mark the largest word and set its color to glowing white
  if (centeredWords.length > 0) {
    const maxWeight = Math.max(...centeredWords.map(w => w.weight))
    centeredWords.forEach(w => {
      w.isLargest = w.weight === maxWeight
      if (w.isLargest) {
        w.color = '#ffffff'
      }
    })
  }

  return centeredWords
})

const qaUpvoteCounts = computed(() => {
  const counts = {}
  responses.value
    .filter(r => r.response_value?.type === 'qa_upvote')
    .forEach(r => {
      const qId = r.response_value.question_id
      if (qId) counts[qId] = (counts[qId] || 0) + 1
    })
  return counts
})

const qaQuestions = computed(() => {
  return responses.value
    .filter(r => r.response_value?.type === 'qa')
    .map(r => ({
      id: r.response_value.id,
      text: r.response_value.text,
      isAnswered: r.response_value.isAnswered || false,
      upvotes: qaUpvoteCounts.value[r.response_value.id] || 0
    }))
    .sort((a, b) => b.upvotes - a.upvotes)
})

const quizLeaderboard = computed(() => {
  if (!currentSlide.value || currentSlide.value.type !== 'quiz') return []
  const correctOption = currentSlide.value.options?.find(o => o.isCorrect)
  if (!correctOption) return []

  const slideStart = presentation.value?.slide_started_at
  return responses.value
    .filter(r => r.response_value?.selected_option_id === correctOption.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 5)
    .map(r => {
      const p = participants.value.find(p => p.session_id === r.session_id)
      const seconds = slideStart
        ? Math.max(0, Math.round((new Date(r.created_at) - new Date(slideStart)) / 1000))
        : '?'
      return {
        session_id: r.session_id,
        nickname: p?.nickname || 'ผู้เล่น',
        emoji: p?.emoji || '👤',
        seconds
      }
    })
})
</script>

<style scoped>
.present-page {
  background-color: #030306;
  color: var(--text-primary);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.present-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
  padding: 24px;
  position: relative;
}

.present-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  z-index: 10;
  gap: 16px;
  width: 100%;
}

.join-prompt {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 24px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  transition: var(--transition-smooth);
  flex-shrink: 0;
}

.join-prompt:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-secondary);
}

.join-code-badge {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--color-secondary);
  font-size: 1.4rem;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px var(--color-secondary-glow);
}

.header-right-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.active-players-badge {
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: var(--color-secondary);
  padding: 6px 16px;
  border-radius: 99px;
  font-weight: 700;
  font-size: 0.95rem;
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.1);
}

.pres-title-watermark {
  font-size: 1.2rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Slide Canvas */
.slide-canvas {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 16px 0;
  min-height: 0;
}

.slide-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-question-wrapper {
  background: rgba(147, 51, 234, 0.08);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(147, 51, 234, 0.4);
  box-shadow: 0 0 15px rgba(147, 51, 234, 0.2), inset 0 0 10px rgba(147, 51, 234, 0.15);
  padding: 8px 24px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 50%;
  flex-grow: 1;
  transition: var(--transition-bounce);
  animation: border-glow-pulse 3s infinite alternate ease-in-out;
}

.header-question-wrapper:hover {
  border-color: rgba(6, 182, 212, 0.6);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.45), inset 0 0 15px rgba(6, 182, 212, 0.2);
}

@keyframes border-glow-pulse {
  0% {
    border-color: rgba(147, 51, 234, 0.3);
    box-shadow: 0 0 10px rgba(147, 51, 234, 0.15), inset 0 0 5px rgba(147, 51, 234, 0.1);
  }
  100% {
    border-color: rgba(147, 51, 234, 0.65);
    box-shadow: 0 0 22px rgba(147, 51, 234, 0.4), inset 0 0 15px rgba(147, 51, 234, 0.25);
  }
}

.slide-question {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  margin: 0;
  background: linear-gradient(90deg, #fff 0%, #c084fc 25%, #22d3ee 50%, #c084fc 75%, #fff 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: text-glow-pulse 3s infinite ease-in-out, shimmer-grad 4s linear infinite;
}

@keyframes text-glow-pulse {
  0% { filter: drop-shadow(0 0 2px rgba(147, 51, 234, 0.3)) brightness(1); }
  50% { filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6)) brightness(1.15); }
  100% { filter: drop-shadow(0 0 2px rgba(147, 51, 234, 0.3)) brightness(1); }
}

@keyframes shimmer-grad {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.presenter-timer {
  background: rgba(147, 51, 234, 0.12);
  border: 1px solid rgba(147, 51, 234, 0.25);
  padding: 10px 14px;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow);
  animation: pulse-timer 1s infinite alternate;
}

.presenter-timer.timer-warn {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.4);
  color: var(--color-danger) !important;
  animation: shake-timer 0.4s infinite alternate;
}

.presenter-timer .timer-tick-icon {
  font-size: 0.8rem;
  opacity: 0.8;
}

.presenter-timer .timer-secs {
  font-size: 1.6rem;
  font-weight: 800;
  font-family: var(--font-display);
}

@keyframes pulse-timer {
  from { transform: scale(1); }
  to { transform: scale(1.05); }
}

@keyframes shake-timer {
  0% { transform: scale(1) rotate(-2deg); }
  100% { transform: scale(1.06) rotate(2deg); }
}

/* Results Layouts */
.results-container {
  width: 100%;
  max-width: 1000px;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.results-hidden {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
}

.eye-icon {
  font-size: 4rem;
  opacity: 0.5;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.5; }
}

/* 1. Multiple Choice / Quiz Columns */
.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-height: 380px;
  gap: 40px;
  padding-bottom: 20px;
}

.chart-bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 140px;
  height: 100%;
  justify-content: flex-end;
}

.bar-value {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 8px;
  font-family: var(--font-display);
}

.bar-track {
  width: 100%;
  flex-grow: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px 12px 0 0;
  position: relative;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 16px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.correct-label {
  color: var(--color-success) !important;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

/* 3. Word Cloud */
.cloud-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: center;
  max-width: 900px;
  padding: 24px;
}

.cloud-word-wrapper {
  position: relative;
  display: inline-block;
}

.cloud-word {
  font-family: var(--font-display);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  transition: var(--transition-bounce);
  animation: word-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards,
             word-drift 6s ease-in-out infinite alternate;
  display: inline-block;
  cursor: default;
  padding: 8px 16px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.cloud-word.largest-word {
  text-shadow: 0 0 25px rgba(255, 255, 255, 0.85), 0 0 10px rgba(6, 182, 212, 0.6);
  font-weight: 900;
  z-index: 10;
}

/* Offsets for drifted animations delays to create fluid float */
.cloud-word-wrapper:nth-child(2n) .cloud-word {
  animation-duration: 8s;
  animation-delay: -2s;
}
.cloud-word-wrapper:nth-child(3n) .cloud-word {
  animation-duration: 7s;
  animation-delay: -4s;
}
.cloud-word-wrapper:nth-child(5n) .cloud-word {
  animation-duration: 9s;
  animation-delay: -1s;
}

/* Hover-revealed delete control for a single word cloud entry */
.cloud-word-delete {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.85);
  color: #fff;
  font-size: 0.65rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: var(--transition-smooth);
  z-index: 20;
}

.cloud-word-wrapper:hover .cloud-word-delete {
  opacity: 1;
  transform: scale(1);
}

.cloud-word-delete:hover {
  background: var(--color-danger);
}

@keyframes word-appear {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes word-drift {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(4px, -6px) rotate(1deg); }
  100% { transform: translate(-4px, 4px) rotate(-1deg); }
}

/* 4. Q&A */
.qa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.qa-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.qa-card.answered {
  opacity: 0.4;
  text-decoration: line-through;
}

.qa-content {
  font-size: 1.1rem;
  line-height: 1.4;
}

.qa-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qa-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.qa-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-qa-action {
  background: transparent;
  border: none;
  color: var(--color-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px;
}

.btn-qa-action:hover {
  text-decoration: underline;
}

.btn-qa-delete {
  color: var(--color-danger);
  font-size: 0.85rem;
  opacity: 0.6;
}

.btn-qa-delete:hover {
  opacity: 1;
  text-decoration: none;
  transform: scale(1.1);
}

/* Floating Control Bar - Thinner and Compact Pill shape */
.control-bar {
  opacity: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  width: fit-content;
  max-width: 90%;
  margin: 0 auto;
  z-index: 100;
  transition: var(--transition-bounce);
  border-radius: 99px !important;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(15px);
  background: rgba(10, 10, 20, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

body:hover .control-bar,
.present-page:hover .control-bar {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.control-left, .control-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slide-counter {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 700;
}

.control-center {
  display: flex;
  gap: 10px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.control-btn svg {
  width: 14px;
  height: 14px;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--color-secondary);
  transform: scale(1.08);
}

.control-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.results-toggle {
  background: rgba(147, 51, 234, 0.15);
  border-color: rgba(147, 51, 234, 0.3);
}

.results-toggle:hover {
  background: rgba(147, 51, 234, 0.3) !important;
}

.inspect-toggle {
  background: rgba(236, 72, 153, 0.15);
  border-color: rgba(236, 72, 153, 0.3);
}

.inspect-toggle:hover:not(:disabled) {
  background: rgba(236, 72, 153, 0.3) !important;
  border-color: var(--color-accent) !important;
}

.quiz-toggle {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
}

.quiz-toggle:hover {
  background: rgba(16, 185, 129, 0.3) !important;
}

.reset-btn {
  color: var(--text-muted);
}

.reset-btn:hover {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.2) !important;
}

/* Welcome Lobby preparation styles */
.welcome-lobby-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(6, 6, 12, 0.95);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px 20px;
  overflow-y: auto;
}

.lobby-card {
  width: 100%;
  max-width: 800px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 28px;
  position: relative;
}

.lobby-icon-badge {
  font-size: 3.5rem;
  animation: float-slow 4s infinite alternate;
}

.lobby-title {
  font-size: 2.2rem;
  font-weight: 800;
}

.lobby-subtitle {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.lobby-join-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 28px 24px;
  border-radius: 16px;
}

.lobby-qr-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.lobby-qr-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.lobby-join-heading {
  font-size: 1.05rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.lobby-join-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.join-detail-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 1rem;
  color: var(--text-secondary);
}

.join-detail-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(147, 51, 234, 0.15);
  border: 1px solid rgba(147, 51, 234, 0.3);
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.lobby-link {
  color: var(--color-secondary);
  font-weight: 700;
  letter-spacing: 0.02em;
  font-size: 1.05rem;
}

.lobby-code-badge {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-secondary);
  background: rgba(6, 182, 212, 0.1);
  padding: 4px 14px;
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  letter-spacing: 0.05em;
}

/* Small icon button for copying join link / room code */
.copy-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-smooth);
  flex-shrink: 0;
}

.copy-icon-btn:hover {
  color: var(--text-primary);
  border-color: var(--color-secondary);
  background: rgba(6, 182, 212, 0.1);
  transform: translateY(-1px);
}

.copy-icon-btn.copied {
  color: var(--color-success);
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.1);
}

.lobby-music-setup {
  width: 100%;
  padding: 20px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lobby-music-setup h3 {
  font-size: 1rem;
}

.music-controls-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.lobby-control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 8px 14px;
}

.lobby-track-group {
  flex: 1;
  min-width: 200px;
}

.lobby-control-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}

.lobby-select {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.lobby-select option {
  background: var(--bg-base);
  color: var(--text-primary);
}

.lobby-volume-group {
  gap: 8px;
}

.vol-icon {
  font-size: 1.1rem;
}

.lobby-volume-slider {
  width: 100px;
  height: 4px;
  cursor: pointer;
  accent-color: var(--color-secondary);
}

.play-preview-btn {
  padding: 10px 18px;
  font-size: 0.85rem;
  white-space: nowrap;
}

.lobby-players-section {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lobby-players-section h3 {
  font-size: 1.05rem;
}

.lobby-players-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 80px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.no-players-hint {
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.9rem;
  margin: auto;
}

.start-lobby-btn {
  width: 100%;
  padding: 16px;
  font-size: 1.25rem;
  margin-top: 10px;
  box-shadow: 0 4px 30px var(--color-primary-glow);
}

/* Audio control bar details */
.music-controller {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.03);
}

.music-icon {
  font-size: 1rem;
}

.music-icon.rotating {
  animation: rotate-music 3s linear infinite;
}

@keyframes rotate-music {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.music-select {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  max-width: 90px;
}

.music-select option {
  background: var(--bg-base);
  color: var(--text-primary);
}

.volume-slider {
  width: 45px;
  height: 3px;
  cursor: pointer;
  accent-color: var(--color-secondary);
}

/* QR Code Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 5, 16, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.qr-card {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.qr-desc {
  color: var(--text-secondary);
}

.qr-link-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 100%;
}

.qr-link-text {
  color: var(--color-secondary);
  font-weight: 700;
  font-size: 1.05rem;
  word-break: break-all;
}

.qr-link-text:hover {
  text-decoration: underline;
}

.qr-code-placeholder {
  margin: 10px 0;
}

.qr-border-box {
  width: 200px;
  height: 200px;
  border: 2px dashed var(--color-primary);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-shadow: 0 0 30px rgba(147, 51, 234, 0.1);
  background: rgba(147, 51, 234, 0.02);
}

.qr-code-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  padding: 6px;
  background: white;
}

@keyframes float-slow {
  0% { transform: translateY(0); }
  100% { transform: translateY(-8px); }
}

@media (max-width: 768px) {
  .welcome-lobby-overlay {
    padding: 10px;
  }
  .lobby-card {
    padding: 24px;
    gap: 16px;
  }
  .lobby-join-panel {
    padding: 20px 16px;
    gap: 16px;
  }
  .join-detail-row {
    font-size: 0.9rem;
  }

  /* Live presentation header: stack instead of cramming into one row */
  .present-header {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 10px;
  }
  .header-question-wrapper {
    order: -1;
    max-width: 100%;
    width: 100%;
    padding: 8px 16px;
  }
  .slide-question {
    font-size: 0.95rem;
  }
  .join-prompt {
    width: 100%;
    justify-content: center;
    padding: 8px 16px;
    gap: 10px;
    font-size: 0.8rem;
  }
  .join-code-badge {
    font-size: 1.1rem;
  }
  .header-right-meta {
    width: 100%;
    justify-content: center;
    gap: 10px;
  }
  .pres-title-watermark {
    display: none;
  }
  .active-players-badge {
    font-size: 0.8rem;
    padding: 5px 12px;
  }

  /* Word cloud: cap word size relative to viewport so words stop overlapping */
  .cloud-wrapper {
    gap: 8px;
    padding: 12px;
  }
  .cloud-word {
    font-size: clamp(1rem, 6vw, 2.4rem) !important;
  }
}

/* Ambient glow nodes and drift animations */
.ambient-glow-bg {
  position: absolute;
  top: -20%;
  left: -20%;
  width: 140%;
  height: 140%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  animation: cosmic-rotate 180s infinite linear;
}

@keyframes cosmic-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  mix-blend-mode: screen;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--color-primary) 0%, rgba(0,0,0,0) 70%);
  top: -10%;
  right: 15%;
  animation: orb-drift-1 25s infinite alternate ease-in-out;
}

.orb-2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--color-secondary) 0%, rgba(0,0,0,0) 70%);
  bottom: -20%;
  left: -10%;
  animation: orb-drift-2 30s infinite alternate ease-in-out;
}

.orb-3 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, var(--color-accent) 0%, rgba(0,0,0,0) 70%);
  top: 35%;
  left: 25%;
  animation: orb-drift-3 22s infinite alternate ease-in-out;
}

.orb-4 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(0,0,0,0) 70%);
  top: 40%;
  right: 35%;
  animation: orb-drift-4 28s infinite alternate ease-in-out;
}

.mysterious-dust {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  pointer-events: none;
  filter: blur(0.5px);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 15px var(--color-secondary-glow);
}

.dust-1 { width: 4.5px; height: 4.5px; top: 25%; left: 30%; animation: mysterious-sparkle 12s infinite ease-in-out; }
.dust-2 { width: 5.5px; height: 5.5px; top: 75%; left: 65%; animation: mysterious-sparkle 16s infinite ease-in-out -4s; }
.dust-3 { width: 3.5px; height: 3.5px; top: 40%; left: 85%; animation: mysterious-sparkle 14s infinite ease-in-out -8s; }
.dust-4 { width: 6px; height: 6px; top: 60%; left: 20%; animation: mysterious-sparkle 18s infinite ease-in-out -2s; }
.dust-5 { width: 4px; height: 4px; top: 15%; left: 70%; animation: mysterious-sparkle 15s infinite ease-in-out -6s; }
.dust-6 { width: 3px; height: 3px; top: 85%; left: 40%; animation: mysterious-sparkle 20s infinite ease-in-out -10s; }

@keyframes mysterious-sparkle {
  0%, 100% {
    transform: translate(0, 0) scale(0.6);
    opacity: 0.1;
  }
  50% {
    transform: translate(30px, -60px) scale(1.3);
    opacity: 0.85;
  }
}

@keyframes orb-drift-1 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.12; }
  50% { transform: translate(-100px, 80px) scale(1.2); opacity: 0.22; }
  100% { transform: translate(50px, -50px) scale(0.95); opacity: 0.12; }
}

@keyframes orb-drift-2 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
  50% { transform: translate(120px, -90px) scale(0.9); opacity: 0.25; }
  100% { transform: translate(-40px, 50px) scale(1.1); opacity: 0.15; }
}

@keyframes orb-drift-3 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.10; }
  50% { transform: translate(-70px, -60px) scale(1.3); opacity: 0.20; }
  100% { transform: translate(80px, 70px) scale(0.85); opacity: 0.10; }
}

@keyframes orb-drift-4 {
  0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
  50% { transform: translate(60px, 80px) scale(1.15); opacity: 0.25; }
  100% { transform: translate(-80px, -40px) scale(0.9); opacity: 0.15; }
}

/* Word Cloud Inspection — shimmering "analyzing" wave instead of a chaotic spin.
   Each word breathes in scale/glow on a staggered delay so the wave ripples
   across the cloud, building anticipation for the reveal. */
.inspecting-active .cloud-word {
  animation: word-shimmer-wave 1s ease-in-out infinite !important;
  transition: none !important;
}
.inspecting-active .cloud-word-wrapper:nth-child(2n) .cloud-word { animation-delay: 0.1s !important; }
.inspecting-active .cloud-word-wrapper:nth-child(3n) .cloud-word { animation-delay: 0.2s !important; }
.inspecting-active .cloud-word-wrapper:nth-child(4n) .cloud-word { animation-delay: 0.3s !important; }
.inspecting-active .cloud-word-wrapper:nth-child(5n) .cloud-word { animation-delay: 0.4s !important; }
.inspecting-active .cloud-word-wrapper:nth-child(6n) .cloud-word { animation-delay: 0.5s !important; }

@keyframes word-shimmer-wave {
  0%, 100% {
    transform: scale(0.88) translateY(0);
    opacity: 0.45;
    filter: brightness(0.8) saturate(1.1) blur(0);
  }
  50% {
    transform: scale(1.22) translateY(-6px);
    opacity: 1;
    filter: brightness(1.6) saturate(1.9) drop-shadow(0 0 16px currentColor);
  }
}

/* Resolved Winner — the chosen word detaches from the cloud and floats to
   dead-center of the screen with a springy pop-in, then settles into a glow pulse */
.resolved-winner .cloud-word.winner-highlight {
  position: fixed !important;
  top: 50%;
  left: 50%;
  z-index: 200;
  color: #ffffff !important;
  animation: winner-center-appear 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
             winner-center-pulse 1.8s 0.7s infinite alternate ease-in-out !important;
}

.resolved-winner .cloud-word-wrapper .cloud-word-delete {
  display: none !important;
}

@keyframes winner-center-appear {
  0% {
    transform: translate(-50%, -50%) scale(0.25) rotate(-10deg);
    opacity: 0;
    text-shadow: none;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.65) rotate(3deg);
    opacity: 1;
    text-shadow: 0 0 45px #ffffff, 0 0 26px var(--color-secondary);
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5) rotate(0deg);
    opacity: 1;
    text-shadow: 0 0 35px #ffffff, 0 0 20px var(--color-secondary);
  }
}

@keyframes winner-center-pulse {
  0% { transform: translate(-50%, -50%) scale(1.5); text-shadow: 0 0 30px #fff, 0 0 16px var(--color-secondary); }
  100% { transform: translate(-50%, -50%) scale(1.65); text-shadow: 0 0 48px #fff, 0 0 28px var(--color-accent), 0 0 14px var(--color-secondary); }
}

.resolved-winner .cloud-word.loser-dim {
  opacity: 0.12 !important;
  filter: blur(2px) !important;
  transform: scale(0.8) !important;
  transition: all 0.5s ease !important;
}

/* ─── Quiz Leaderboard Overlay ─── */
.leaderboard-card {
  width: 100%;
  max-width: 480px;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.lb-title {
  font-size: 2rem;
  font-weight: 800;
  font-family: var(--font-display);
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.lb-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: -12px;
}

.lb-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  padding: 24px 0;
  font-size: 0.95rem;
}

.lb-empty span {
  font-size: 2.5rem;
}

.lb-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: var(--transition-smooth);
  animation: lb-row-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.lb-row.rank-1 {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
}

.lb-row.rank-2 {
  background: rgba(148, 163, 184, 0.08);
  border-color: rgba(148, 163, 184, 0.2);
}

.lb-row.rank-3 {
  background: rgba(205, 127, 50, 0.08);
  border-color: rgba(205, 127, 50, 0.2);
}

@keyframes lb-row-in {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.lb-row:nth-child(2) { animation-delay: 0.08s; }
.lb-row:nth-child(3) { animation-delay: 0.16s; }
.lb-row:nth-child(4) { animation-delay: 0.24s; }
.lb-row:nth-child(5) { animation-delay: 0.32s; }

.lb-rank {
  font-size: 1.5rem;
  width: 32px;
  flex-shrink: 0;
}

.lb-avatar {
  font-size: 1.6rem;
}

.lb-name {
  flex: 1;
  font-weight: 700;
  font-size: 1.05rem;
  text-align: left;
}

.lb-speed {
  font-size: 0.85rem;
  color: var(--color-secondary);
  font-weight: 700;
  background: rgba(6, 182, 212, 0.1);
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.lb-close-btn {
  width: 100%;
  margin-top: 4px;
}

.leaderboard-toggle {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

.leaderboard-toggle:hover {
  background: rgba(245, 158, 11, 0.3) !important;
  border-color: rgba(245, 158, 11, 0.5) !important;
}

/* ─── Quiz Reveal Flash ─── */
.quiz-reveal-flash {
  position: absolute;
  inset: -20px;
  background: rgba(16, 185, 129, 0.25);
  border-radius: 20px;
  animation: reveal-flash 0.7s ease-out forwards;
  pointer-events: none;
  z-index: 50;
}

@keyframes reveal-flash {
  0% { opacity: 1; transform: scale(1.02); }
  60% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}

.correct-column .bar-value {
  color: var(--color-success);
  text-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
  animation: correct-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes correct-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}

.wrong-label {
  color: rgba(239, 68, 68, 0.6) !important;
  font-size: 0.9rem;
}

/* ─── Q&A Spotlight Overlay ─── */
.spotlight-overlay {
  background: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(20px);
}

.spotlight-card {
  width: 100%;
  max-width: 680px;
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;
  border-color: rgba(245, 158, 11, 0.4) !important;
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.15), 0 0 120px rgba(245, 158, 11, 0.05) !important;
  animation: spotlight-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes spotlight-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

.spotlight-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  padding: 6px 18px;
  border-radius: 99px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spotlight-text {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
  font-family: var(--font-display);
}

.spotlight-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spotlight-votes {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-secondary);
  background: rgba(6, 182, 212, 0.1);
  padding: 6px 18px;
  border-radius: 99px;
  border: 1px solid rgba(6, 182, 212, 0.25);
}

.spotlight-close-only {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* ─── Q&A card enhancements ─── */
.qa-upvote-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-secondary);
  background: rgba(6, 182, 212, 0.08);
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid rgba(6, 182, 212, 0.15);
  align-self: flex-start;
  margin-bottom: -4px;
}

.qa-card {
  border: 1px solid rgba(147, 51, 234, 0.2);
  transition: var(--transition-smooth);
}

.qa-card:not(.answered):not(.spotlight) {
  box-shadow: 0 0 12px rgba(147, 51, 234, 0.08);
}

.qa-card.spotlight {
  border-color: rgba(245, 158, 11, 0.5) !important;
  box-shadow: 0 0 25px rgba(245, 158, 11, 0.2) !important;
  background: rgba(245, 158, 11, 0.05) !important;
}

.btn-qa-spotlight {
  color: #f59e0b;
  font-size: 1rem;
  padding: 2px;
  opacity: 0.7;
  transition: var(--transition-smooth);
}

.btn-qa-spotlight:hover {
  opacity: 1;
  transform: scale(1.2);
  text-decoration: none !important;
}

@media (max-width: 1024px) {
  .control-bar {
    position: relative !important;
    bottom: auto !important;
    left: auto !important;
    transform: none !important;
    width: 100% !important;
    max-width: 100% !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    align-items: center !important;
    row-gap: 12px !important;
    column-gap: 8px !important;
    padding: 14px 18px !important;
    border-radius: 20px !important;
    opacity: 1 !important;
  }

  /* Dissolve the three grouping divs so every control becomes one cohesive,
     centered cluster that wraps as a unit instead of three separately-centered rows */
  .control-left, .control-center, .control-right {
    display: contents;
  }

  /* Keep reset/QR with the icon cluster, but always ahead of the music panel
     so the forced line-break below doesn't strand them on their own row */
  .reset-btn, .qr-btn {
    order: 1;
  }

  /* Music panel is the widest piece — give it a dedicated full-width row
     beneath the icon cluster so nothing floats awkwardly beside it */
  .music-controller {
    order: 2;
    flex-basis: 100%;
    width: 100% !important;
    justify-content: center;
    margin-top: 2px;
  }

  .music-select {
    max-width: 140px;
  }
}
</style>

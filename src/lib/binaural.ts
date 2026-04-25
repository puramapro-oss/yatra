/**
 * BinauralEngine — Web Audio binaural beats.
 * Crée 2 oscillateurs sinusoïdaux (un par oreille via StereoPanner)
 * avec un offset de fréquence = beatHz. Le cerveau perçoit le battement.
 *
 * Lazy AudioContext init (browser policy : user gesture required).
 * Crossfade gain 600ms quand on change de mode.
 */

export type BinauralConfig = {
  carrierHz: number
  beatHz: number
  volume: number // 0..1
}

type EngineState = 'idle' | 'starting' | 'playing' | 'stopping'

export class BinauralEngine {
  private ctx: AudioContext | null = null
  private oscL: OscillatorNode | null = null
  private oscR: OscillatorNode | null = null
  private gainL: GainNode | null = null
  private gainR: GainNode | null = null
  private masterGain: GainNode | null = null
  private state: EngineState = 'idle'

  /** Démarre la lecture. Doit être appelé suite à un user gesture. */
  async play(config: BinauralConfig): Promise<void> {
    if (this.state === 'playing' || this.state === 'starting') {
      this.crossfadeTo(config)
      return
    }
    this.state = 'starting'
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0
    this.masterGain.connect(this.ctx.destination)

    this.oscL = this.ctx.createOscillator()
    this.oscR = this.ctx.createOscillator()
    this.oscL.type = 'sine'
    this.oscR.type = 'sine'
    this.oscL.frequency.value = config.carrierHz
    this.oscR.frequency.value = config.carrierHz + config.beatHz

    this.gainL = this.ctx.createGain()
    this.gainR = this.ctx.createGain()
    this.gainL.gain.value = 0.5
    this.gainR.gain.value = 0.5

    const panL = this.ctx.createStereoPanner()
    const panR = this.ctx.createStereoPanner()
    panL.pan.value = -1
    panR.pan.value = 1

    this.oscL.connect(this.gainL).connect(panL).connect(this.masterGain)
    this.oscR.connect(this.gainR).connect(panR).connect(this.masterGain)

    this.oscL.start()
    this.oscR.start()

    // fade in
    const target = clamp(config.volume, 0, 1)
    this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.6)
    this.state = 'playing'
  }

  private crossfadeTo(config: BinauralConfig) {
    if (!this.ctx || !this.oscL || !this.oscR || !this.masterGain) return
    const now = this.ctx.currentTime
    const target = clamp(config.volume, 0, 1)
    this.oscL.frequency.linearRampToValueAtTime(config.carrierHz, now + 0.6)
    this.oscR.frequency.linearRampToValueAtTime(config.carrierHz + config.beatHz, now + 0.6)
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.6)
  }

  setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return
    const target = clamp(volume, 0, 1)
    this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.2)
  }

  async stop() {
    if (this.state === 'idle' || this.state === 'stopping') return
    this.state = 'stopping'
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.4)
      await new Promise((r) => setTimeout(r, 450))
    }
    try {
      this.oscL?.stop()
      this.oscR?.stop()
      this.oscL?.disconnect()
      this.oscR?.disconnect()
    } catch {
      // already stopped
    }
    this.oscL = null
    this.oscR = null
    this.gainL = null
    this.gainR = null
    this.masterGain = null
    this.state = 'idle'
  }

  isPlaying() {
    return this.state === 'playing' || this.state === 'starting'
  }

  async dispose() {
    await this.stop()
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        await this.ctx.close()
      } catch {
        // ignore
      }
    }
    this.ctx = null
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

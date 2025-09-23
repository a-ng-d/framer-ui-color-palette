const enableTrial = async (trialTime: number, trialVersion: string) => {
  const now = new Date().getTime()

  window.localStorage.setItem('trial_start_date', now.toString())
  window.localStorage.setItem('trial_version', trialVersion)
  window.localStorage.setItem('trial_time', trialTime.toString())

  return window.postMessage({
    type: 'ENABLE_TRIAL',
    data: {
      date: now,
      trialTime: trialTime,
    },
  })
}

export default enableTrial

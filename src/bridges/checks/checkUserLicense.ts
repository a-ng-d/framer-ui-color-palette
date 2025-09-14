const checkUserLicense = async () => {
  const licenseKey = window.localStorage.getItem('user_license_key')
  const instanceId = window.localStorage.getItem('user_license_instance_id')

  if (licenseKey !== null && instanceId !== null)
    return window.postMessage(
      {
        type: 'CHECK_USER_LICENSE',
        data: {
          licenseKey: licenseKey,
          instanceId: instanceId,
        },
      },
      '*'
    )
  return false
}

export default checkUserLicense

// AWS Cognito configuration for admin authentication
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_yVRt9an9Q',       
      userPoolClientId: '7bgrd9vmbepbe2pup7tupf18ba',
      loginWith: {
        username: true
      },
      allowGuestAccess: false
    }
  }
}
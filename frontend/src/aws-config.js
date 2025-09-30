// AWS Cognito configuration for jAilbreak authentication
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_yVRt9an9Q',       
      userPoolClientId: '7j4p2pidbarqutnp15evetdhps', 
      identityPoolId: 'eu-central-1:5be21a9b-ad2c-4509-8e0b-224804410240', 
      loginWith: {
        email: true
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true
        },
        name: {
          required: true
        }
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false
      }
    }
  }
}
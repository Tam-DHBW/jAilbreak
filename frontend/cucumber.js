module.exports = {
  default: {
    import: ['features/support/**/*.js'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    paths: ['features/*.feature']
  }
}
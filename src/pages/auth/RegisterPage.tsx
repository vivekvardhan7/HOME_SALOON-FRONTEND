import { Helmet } from 'react-helmet-async';

// ... (existing imports)

const RegisterPage = () => {
  // ... (rest of hook logic)

  return (
    <div className="min-h-screen bg-[#fdf6f0]">
      <Helmet>
        <title>Register | Home Bonzenga</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* ... rest of the component ... */}
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-[#f8d7da]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              onClick={() => {
                const getRedirect = (role?: string) => {
                  if (role === 'ADMIN') return '/admin';
                  if (role === 'MANAGER') return '/manager';
                  if (role === 'VENDOR') return '/vendor';
                  return '/';
                };
                navigate(getRedirect(user?.role));
              }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <img
                src={logo}
                alt="Home Bonzenga Logo"
                className="h-12 w-12 rounded-full object-cover border-2 border-[#f8d7da] shadow-md"
              />
              <span className="text-2xl font-serif font-bold text-[#4e342e]">HOME BONZENGA</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const getRedirect = (role?: string) => {
                    if (role === 'ADMIN') return '/admin';
                    if (role === 'MANAGER') return '/manager';
                    if (role === 'VENDOR') return '/vendor';
                    return '/';
                  };
                  navigate(getRedirect(user?.role));
                }}
                className="text-[#6d4c41] hover:text-[#4e342e] font-medium transition-colors"
              >
                Home
              </button>
              <Link to="/login" className="bg-[#4e342e] hover:bg-[#3b2c26] text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Register Form */}
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-[#4e342e] mb-4">Create Account</h1>

          </div>

          {/* Registration Form */}
          <Card className="border-0 bg-white shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#fdf6f0] to-[#f8e8e0] p-8">
              <CardTitle className="text-2xl font-serif font-bold text-[#4e342e] text-center">
                {isEmailSent ? (
                  "Check Your Inbox"
                ) : (
                  <p className="text-lg text-[#6d4c41]">Join HOME BONZENGA and start your beauty journey</p>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {isEmailSent ? (
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-[#4e342e]">Registration Successful!</p>
                    <p className="text-[#6d4c41]">
                      We've sent a verification link to your email address.
                      Please check your inbox and click the link to activate your account.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-[#4e342e] text-white py-3 rounded-xl"
                  >
                    Go to Login
                  </Button>
                  <p className="text-sm text-[#6d4c41]">
                    Didn't receive the email? Check your spam folder or try signing in to resend.
                  </p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.register.accountType')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('auth.register.accountType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4" />
                                  <span>{t('auth.register.customer')}</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="VENDOR">
                                <div className="flex items-center space-x-2">
                                  <Building className="w-4 h-4" />
                                  <span>Vendor</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.register.firstName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('auth.register.firstName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.register.lastName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('auth.register.lastName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.register.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t('auth.register.email')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.register.phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('auth.register.phone')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.register.password')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('auth.register.createPassword')}
                                {...field}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.register.confirmPassword')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder={t('auth.register.confirmYourPassword')}
                                {...field}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#4e342e] to-[#6d4c41] hover:from-[#3b2c26] hover:to-[#5a3520] text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </Form>
              )}

              {!isEmailSent && (
                <div className="mt-8 text-center">
                  <p className="text-base text-[#6d4c41]">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-[#4e342e] hover:text-[#3b2c26] transition-colors"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;

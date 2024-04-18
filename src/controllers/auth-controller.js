import crypto from 'crypto'

export class AuthController {
    /**
     * Authorizes a user.
     * login POST.
     *
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    loginGet(req, res, next) {
        res.render('auth/login')
    }

    /**
     * Authorizes a user.
     * login POST.
     *
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    async loginPost(req, res, next) {
        // Logic for handling login form submission (e.g., validating credentials)
        try {
            const codeVerifier = process.env.CODE_VERIFIER;

            // Create a SHA-256 hash of the code verifier
            const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64')
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')

            const state = crypto.randomBytes(16).toString('hex')

            const authorizationUrl = `https://gitlab.lnu.se/oauth/authorize?client_id=${process.env.APPLICATION_ID}&redirect_uri=${process.env.GITLAB_REDIRECT_URI}&response_type=code&state=${state}&scope=read_api&code_challenge=${codeChallenge}&code_challenge_method=S256`

            res.redirect(authorizationUrl)

        } catch (error) {
            console.error('Error while redirecting to GitLab for authorization:', error)
            res.status(500).send('Internal Server Error')
        }
    }

    async handleCallback(req, res, next) {
        try {
            const { code, state } = req.query
            if (!code) {
                throw new Error('Authorization code not found in callback')
            }
            if (!state) { // Verify the state parameter!!!!
                throw new Error('Invalid state parameter')
            }

            const accessToken = await this.getAccessToken(code, state)
            req.session.accessToken = accessToken

            const userData = await this.getUserData(accessToken)

            req.session.user = userData
            console.log("this is the req.session:" , req.session)
            console.log("Setting user data in session:", req.session.user)
            res.redirect('/wt1')

        } catch (error) {
            console.error('Error while handling callback:', error)
            res.status(500).send('Internal Server Error')
        }
    }

    async getAccessToken(code, state) {
        try {
            const tokenEndpoint = 'https://gitlab.lnu.se/oauth/token'
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: process.env.APPLICATION_ID,
                    client_secret: process.env.GITLAB_SECRET,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: process.env.GITLAB_REDIRECT_URI,
                    code_verifier: process.env.CODE_VERIFIER
                })
            })

            if (!response.ok) {
                throw new Error('Failed to obtain access token')
            }

            const tokenData = await response.json()
            return tokenData.access_token
        } catch (error) {
            console.error('Error while obtaining access token:', error)
            res.status(500).send('Internal Server Error')
        }
    }

    async getUserData(accessToken) {
        try {
            const response = await fetch('https://gitlab.lnu.se/api/v4/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to obtain user data')
            }

            return await response.json()
        } catch (error) {
            console.error('Error while obtaining user data:', error)
            res.status(500).send('Internal Server Error')
        }
    }

    // Check over the logout function
    async logout(req, res, next) {
        // Destroy the session and the access token
        await req.session.destroy((err) => {
            if (err) {
                console.error('Error while destroying session:', err)
                return res.status(500).send('Internal Server Error')
            }
            // Cleanse the cookie and redirect to the home page
            res.clearCookie(process.env.SESSION_NAME)
            res.redirect('/wt1')
        })
    }

}
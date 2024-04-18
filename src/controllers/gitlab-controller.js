import dateFormat from 'date-format'

export class GitlabController { 

    getProfile(req, res, next) {
        res.render('gitlab/profile')
    }

    // Getting the projects from GitLab using access token and GraphQL
    async getProjects(req, res, next) {
        try {
            // If the user is not logged in, redirect to the home page
            if (!req.session.accessToken) {
                res.redirect('./')
                return
            }

            const graphqlQuery = `query {
                currentUser {
                    username
                    groups(first: 3) {
                        nodes {
                            name
                            webUrl
                            avatarUrl
                            fullPath
                            projects(first: 5) {
                                nodes {
                                    name
                                    webUrl
                                    avatarUrl
                                    fullPath
                                    repository {
                                        tree {
                                            lastCommit {
                                                author {
                                                    username
                                                    name
                                                    avatarUrl
                                                }
                                                committedDate
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`

            // POST the query to the GitLab API
            const response = await fetch('https://gitlab.lnu.se/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${req.session.accessToken}`
                },
                body: JSON.stringify({ query: graphqlQuery })
            })

            // If the response is not OK, throw an error
            if (!response.ok) {
                throw new Error('Failed to obtain user data')
            }

            // Save the response as JSON
            const data = await response.json()
            console.log("Groups: ", data.data.currentUser.groups.nodes)

            // Provide the data to req.session.projects
            req.session.projects = await data.data.currentUser.groups.nodes.projects
            req.session.groups = await data.data.currentUser.groups.nodes
            res.render('gitlab/projects', { projects: req.session.projects, groups: req.session.groups })
        } catch (error) {
            // Handle error
            console.error('Error fetching projects:', error)
            res.status(500).send('Failed to fetch projects from GitLab')
        }
    }


    // Getting the activities from gitlab using access token and GraphQL
    async getActivities(req, res, next) {
        try {
            if (!req.session.accessToken) {
                res.redirect('./')
                return
            }

            // Initialize an empty array to store all userEvents
            let allUserEvents = []
            const activitiesPerPage = 25
            const currentPage = parseInt(req.query.page) || 1
            const startIndex = (currentPage - 1) * activitiesPerPage
            const endIndex = currentPage * activitiesPerPage

            // Function to fetch userEvents recursively until 101 events are retrieved
            const fetchUserEvents = async (page = 1) => {
                const userEventsResponse = await fetch(`https://gitlab.lnu.se/api/v4/users/${req.session.user.id}/events?page=${page}&per_page=100`, {
                    headers: {
                        Authorization: `Bearer ${req.session.accessToken}`
                    }
                })

                if (!userEventsResponse.ok) {
                    throw new Error('Failed to fetch user events')
                }

                const userEvents = await userEventsResponse.json()
                allUserEvents = [...allUserEvents, ...userEvents]

                // If there are less than 100 events in the current response or we have reached 101 events, stop fetching
                if (userEvents.length < 100 || allUserEvents.length >= 101) {
                    return allUserEvents.slice(0, 101) // Return only the first 101 events
                }

                // Fetch next page of events
                return fetchUserEvents(page + 1)
            }

            // Fetch userEvents recursively
            const userEvents = await fetchUserEvents()
            const totalPages = Math.ceil(userEvents.length / activitiesPerPage)
            const paginatedUserEvents = userEvents.slice(startIndex, endIndex)

            // Format the created_at dates
            userEvents.forEach(activity => {
                activity.created_at = dateFormat('dd.MM.yyyy hh:mm:ss', new Date(activity.created_at))
            })

            req.session.activities = userEvents;
            res.render('gitlab/activities', { 
                activities: paginatedUserEvents,
                currentPage: currentPage,
                totalPages: totalPages
            })

        } catch (error) {
            console.error('Error fetching activities:', error)
            res.status(500).send('Failed to fetch activities from GitLab')
        }

    }
}
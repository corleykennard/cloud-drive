<Nav />
<Router {routes} />
<script>
import createAuth0Client from '@auth0/auth0-spa-js';
// either with async/await
let auth0 = "",
  user = "";

(async () => {
  //isAuthenticated = await auth0.isAuthenticated();
  auth0 = await createAuth0Client({
    domain: "nhlong.auth0.com",
    client_id: "DL3NAj77A2fplyYSs9e9JXqiVxZUHvbx",
    cacheLocation: "localstorage",
  })
  if (!(await auth0.isAuthenticated())) {
    await auth0.loginWithPopup();
    user = await auth0.getUser();
    const accessToken = await auth0.getTokenSilently();
    alert(accessToken);
  }
})();
import Router from 'svelte-spa-router'
import routes from './routes'
import Nav from './Nav.svelte'
</script>

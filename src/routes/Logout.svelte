<script>
import createAuth0Client from '@auth0/auth0-spa-js';
(async()=>{
let  auth0 = await createAuth0Client({
    domain: "nhlong.auth0.com",
    client_id: "DL3NAj77A2fplyYSs9e9JXqiVxZUHvbx",
    cacheLocation: "localstorage",
  });
  auth0.logout({returnTo: window.location.origin})
  })();
</script>
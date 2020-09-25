
<script>
   import { onMount } from 'svelte';
   import {location} from 'svelte-spa-router'
   export let params = {}
   let count = 0;
 $:  if(params.wild==null){
   params.wild=""
   }
  const fetchData = async (parent) =>{
  let res =await fetch(`${api_url}/database?func=getFilesInParent&arg=/${parent}`)      .catch((e) => {
           alert(e)
         });
         res =await res.json()
         count+=1
         if(count>9){
         alert(count)
         }
   	data= res.data
       	}
      let api_url = "https://cloud-drive.vercel.app/api";
      let data =[]
$: fetchData(params.wild)
       
const fileSizeToShortString = (fileSize) => {
     if (fileSize < 2 ** 10) {
       return `${fileSize} B`;
     }
     if (fileSize < 2 ** 20) {
       return `${Math.floor(fileSize / 2 ** 10)} KB`;
     }
     if (fileSize < 2 ** 30) {
       return `${Math.floor(fileSize / 2 ** 20)} MB`;
     }
     return `${Math.floor(fileSize / 2 ** 30)} GB`;
   };
   
</script>


<div class="uk-overflow-auto">
   <table class="uk-table uk-table-hover uk-table-middle uk-table-divider">
      <thead>
         <tr>
            <th class="uk-table-shrink">
               <input class="uk-checkbox" type="checkbox" />
            </th>
            <th class="uk-table-shrink">Images</th>
            <th class="uk-table-expand">Name</th>
            <th class="uk-table-shrink">Size</th>
         </tr>
      </thead>
      <tbody>
         {#each data as file}
         <tr>
            <td>
               <input class="uk-checkbox" type="checkbox" />
            </td>
            <td>
            {#if file.data.type=="file"}
               <img
                  class="uk-preserve-width"
                  src='https://img.icons8.com/color/344/file.png https://img.icons8.com/fluent/344/folder-invoices.png'
                  width="40"
                  alt=""
                  />
            {:else}
            <img
                  class="uk-preserve-width"
                  src='https://img.icons8.com/fluent/344/folder-invoices.png'
                  width="40"
                  alt=""
                  />
         {/if}
            </td>
            <td class="uk-table-link">
            {#if file.data.type=='folder'}
            
            {#if file.data.parent == "/"}
            <a
                  class="uk-link-reset"
                  href="#{$location+ file.data.name}"
                  >
                  {file.data.name}
               </a>
            {:else}
               <a
                  class="uk-link-reset"
                  href="#{$location+'/'+ file.data.name}"
                  >
                  {file.data.name}
               </a>
               {/if}
            {:else}
            <a
                  class="uk-link-reset"
                  href="https://gateway.ipfs.io/ipfs/{file.data.ipfsHash}"
                  >
                  {file.data.name}
               </a>
            {/if}  
            </td>
            <td class="uk-text-nowrap">{#if file.data.type == "file"}
               {fileSizeToShortString(file.data.size)}{/if}
            </td>
         </tr>
         {/each}
      </tbody>
   </table>
</div>
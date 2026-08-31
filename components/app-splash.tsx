/**
 * Pantalla de apertura con el logo.
 *
 * Solo aparece al ABRIR la app, no al cambiar de pestaña: el script en línea
 * marca la sesión la primera vez y, en las siguientes cargas del documento, se
 * oculta antes de pintar (por eso va en línea y no en un efecto de React: un
 * efecto llega después del primer pintado y se vería un parpadeo).
 *
 * Desaparece con una animación CSS, sin depender de JavaScript: si algo falla
 * al hidratar, la pantalla se quita igual y nunca deja la app tapada.
 */
export function AppSplash() {
  return (
    <>
      <div id="app-splash" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={72} height={72} />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(sessionStorage.getItem('metoo-splash')){document.getElementById('app-splash').style.display='none';}else{sessionStorage.setItem('metoo-splash','1');}}catch(e){}})();`,
        }}
      />
    </>
  )
}

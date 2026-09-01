import Image from 'next/image'

/**
 * Pantalla de apertura con el logo.
 *
 * Aparece SOLO al abrir la app de verdad: una carga de documento sobre
 * /dashboard, /feed u /onboarding. Ni en la landing ni en las páginas legales,
 * que son estáticas y se pintan en ~100 ms: taparlas 900 ms las hacía parecer
 * ocho veces más lentas de lo que son.
 *
 * Todo se decide en el script en línea, y eso es deliberado:
 *
 *  - Corre durante el parseo, antes del primer pintado, así que no hay
 *    parpadeo (un efecto de React llegaría tarde).
 *  - Solo se ejecuta en cargas de documento completas, que es exactamente
 *    cuando hay algo que decidir. En navegación de cliente el div ya quedó en
 *    `display:none` de la primera pasada y ahí se queda, así que no puede
 *    reaparecer al cambiar de pestaña. Por eso no hace falta mover el
 *    componente a layouts anidados: React no ejecuta los <script> que inserta
 *    al navegar, y ahí sí se animaría de nuevo en cada salto.
 *
 * La marca de sesión solo se pone en rutas de app: si alguien llega por la
 * landing y luego abre /dashboard con una carga completa, esa sí es una
 * apertura y merece su splash.
 *
 * Desaparece con una animación CSS, sin depender de JavaScript: si algo falla
 * al hidratar, la pantalla se quita igual y nunca deja la app tapada.
 */
const RUTAS_DE_APP = String.raw`^\/(dashboard|feed|onboarding)(\/|$)`
export function AppSplash() {
  return (
    <>
      <div id="app-splash" aria-hidden="true">
        {/* next/image para que llegue ya redimensionado a 72 px y en WebP, en
            vez del original de 512 px. `priority` lo precarga: es lo único que
            se ve mientras arranca la app. */}
        <Image src="/logo.png" alt="" width={72} height={72} priority />
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html:
            `(function(){` +
            `var e=document.getElementById('app-splash');if(!e)return;` +
            `var app=new RegExp(${JSON.stringify(RUTAS_DE_APP)}).test(location.pathname);` +
            `var visto=false;try{visto=!!sessionStorage.getItem('metoo-splash')}catch(x){}` +
            `if(!app||visto){e.style.display='none';return}` +
            `try{sessionStorage.setItem('metoo-splash','1')}catch(x){}` +
            `})();`,
        }}
      />
    </>
  )
}

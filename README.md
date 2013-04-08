SHUKBOX
====================

Shukbox es un proyecto creado de la necesidad de querer compartir listas de videos entre amigos y poder modificarlas entre todos los que las están escuchado.

Shukbox es una single page app que permite crear listas, compartirlas, modificarlas junto con tus amigos en tiempo real (en vivo). Tambien permite sincronizarce con el creador de la lista para escuchar los temas que el esta escuchando en ese mismo momento.

Despues de meses de no poder dedicarle tiempo suficiente al proyecto tome la decisión de liberar el codigo para que shukbox crezca y pueda ser utilizado por los que quieran.

Al día de publicación cuenta con numerosos bugs y menos de la mitad de las funcionalidades que originalmente se pensaron.

INSTALACIÓN
-----------------------------------
	$ curl https://install.meteor.com | /bin/sh
	$ cd MyProyectFolder
	$ git clone https://github.com/topicus/shukbox.git
	$ cd shukbox/shuk
	$ meteor run

BACKLOG
-----------------------------------
* Hacer aparecer la lista lateral cuando se hace click en my lists
* Drag and drop de items para cambiar el orden de reproduccion
* Mejora de controles para reproducción
* Fixear bug cuando llego al final de la pagina y no hay query de busqueda para que no realice una busqueda en youtube con una query vacía.
* Agregar la posibilidad de invitar a otros usuarios
* Arreglar media query en ie8 para que se renderice correctamente
* Crear un chat para interación entre los usuarios escuchando una misma lista
* Mostrar las listas que se estan reproduciendo cerca tuyo
* No permitir agregar más de 2 temas por persona seguidos para evitar trolls
* Arreglar visualizacion en celulares y tablets
* Input text en android no funciona
* Posibilidad de permitir modificar solo la lista por las personas que el creador quiere
* Control remoto de lista
* Salvar estos temas de la lista actual en otra
* Agregar boton para logout al momento de hacer click en el usuario arriba a la derecha
* Crear plugin de chrome para agregar temas a una
* Enviar canciones a amigos
* Dejar siempre los ultimos temas escuchados en un historial
* Mejorar interfaz de cada item agregado a la lista de reproducción
import {defineField, defineType} from "sanity";

export const projectType = defineType({
  name: "project",
  title: "Proyecto",
  type: "document",
  fields: [
    defineField({name: "title", title: "Nombre del proyecto", type: "string", validation: (rule) => rule.required()}),
    defineField({name: "slug", title: "Identificador web", type: "slug", options: {source: "title", maxLength: 96}, validation: (rule) => rule.required()}),
    defineField({name: "year", title: "Año", type: "number", validation: (rule) => rule.integer().min(2000).max(2100)}),
    defineField({
      name: "category",
      title: "Categoría",
      type: "string",
      options: {list: [
        "Obra autoral", "Exposición de arte", "Instalación interactiva",
        "Videomapping escénico", "Teatro", "Evento de moda",
        "Activación comercial", "Espacio cultural", "Institución / gobierno",
        "Visuales generativos"
      ]},
      validation: (rule) => rule.required()
    }),
    defineField({name: "clientOrSpace", title: "Cliente, espacio o colaborador", type: "string"}),
    defineField({name: "location", title: "Lugar", type: "string"}),
    defineField({name: "isPublic", title: "Publicar en el sitio", type: "boolean", initialValue: false}),
    defineField({name: "featured", title: "Proyecto destacado", type: "boolean", initialValue: false}),
    defineField({name: "order", title: "Orden", description: "Los números menores aparecen primero.", type: "number", initialValue: 100}),
    defineField({name: "role", title: "Rol de Visuales del Desierto", type: "text", rows: 3}),
    defineField({name: "shortDescription", title: "Descripción corta", type: "text", rows: 4, validation: (rule) => rule.max(320)}),
    defineField({
      name: "vimeoUrl",
      title: "Video principal de Vimeo",
      description: "Se muestra primero. Puedes conservar este enlace y agregar más videos en la lista de abajo.",
      type: "url",
      validation: (rule) => rule.uri({scheme: ["https"]}).custom((url) => {
        if (!url) return true;
        return /^https:\/\/(?:www\.)?vimeo\.com\/(?:manage\/videos\/)?\d+(?:[/?#].*)?$/.test(url)
          ? true
          : "Introduce un enlace válido de Vimeo.";
      })
    }),
    defineField({
      name: "vimeoOrientation",
      title: "Orientación del video principal",
      description: "Elige la forma original del video para que se vea grande y sin recortes.",
      type: "string",
      initialValue: "vertical",
      options: {layout: "radio", list: [
        {title: "Horizontal (16:9)", value: "horizontal"},
        {title: "Vertical (9:16)", value: "vertical"}
      ]}
    }),
    defineField({
      name: "videos",
      title: "Videos adicionales de Vimeo",
      description: "Agrega un elemento por video. Puedes arrastrarlos para cambiar su orden. El video principal se muestra primero; los enlaces repetidos solo aparecen una vez.",
      type: "array",
      of: [{
        type: "object",
        name: "projectVideo",
        title: "Video",
        fields: [
          defineField({name: "title", title: "Título del video (opcional)", type: "string"}),
          defineField({
            name: "url",
            title: "Enlace de Vimeo",
            description: "Pega el enlace completo. Si el video es no listado, conserva también su código privado en la URL.",
            type: "url",
            validation: (rule) => rule.required().uri({scheme: ["https"]}).custom((url) => {
              if (!url) return true;
              return /^https:\/\/(?:www\.)?vimeo\.com\/(?:manage\/videos\/)?\d+(?:[/?#].*)?$/.test(url)
                ? true
                : "Introduce un enlace válido de Vimeo.";
            })
          }),
          defineField({
            name: "orientation",
            title: "Orientación",
            description: "Selecciona la forma original de este video.",
            type: "string",
            initialValue: "vertical",
            options: {layout: "radio", list: [
              {title: "Horizontal (16:9)", value: "horizontal"},
              {title: "Vertical (9:16)", value: "vertical"}
            ]}
          })
        ],
        preview: {
          select: {title: "title", subtitle: "url"},
          prepare({title, subtitle}) { return {title: title || "Video de Vimeo", subtitle}; }
        }
      }]
    }),
    defineField({name: "technologies", title: "Tecnologías", type: "array", of: [{type: "string"}], options: {layout: "tags"}}),
    defineField({
      name: "galleryImages",
      title: "Fotografías del proyecto",
      description: "Sube las imágenes que podrán recorrerse en la galería. Puedes arrastrarlas para cambiar su orden.",
      type: "array",
      of: [{
        type: "image",
        options: {hotspot: true},
        fields: [
          defineField({name: "caption", title: "Pie de foto (opcional)", type: "string"}),
          defineField({
            name: "alt",
            title: "Descripción accesible",
            description: "Describe brevemente lo que aparece en esta fotografía.",
            type: "string",
            validation: (rule) => rule.required()
          })
        ]
      }]
    }),
    defineField({
      name: "heroImage",
      title: "Imagen principal",
      type: "image",
      options: {hotspot: true},
      fields: [defineField({name: "alt", title: "Descripción accesible", type: "string", validation: (rule) => rule.required()})]
    }),
    defineField({name: "credits", title: "Créditos", type: "array", of: [{type: "string"}]})
  ],
  orderings: [{
    title: "Orden del sitio",
    name: "siteOrder",
    by: [
      {field: "featured", direction: "desc"},
      {field: "order", direction: "asc"},
      {field: "year", direction: "desc"}
    ]
  }],
  preview: {select: {title: "title", subtitle: "category", media: "heroImage"}}
});

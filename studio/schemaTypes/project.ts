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
    defineField({name: "technologies", title: "Tecnologías", type: "array", of: [{type: "string"}], options: {layout: "tags"}}),
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
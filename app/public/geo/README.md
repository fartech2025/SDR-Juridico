Coloque aqui os arquivos de mapa para o site.

Disponível atualmente:
- `minas-municipios-macro.geojson`: GeoJSON contendo **todos os municípios**, as **mesorregiões (macro-regiões)** e o **contorno estadual** de Minas Gerais. Os atributos foram enriquecidos com os nomes oficiais do IBGE e podem ser acessados em `feature.properties`.

Como usar:
- Os arquivos em `public/` ficam disponíveis via HTTP. Ex.: `/geo/minas-municipios-macro.geojson`.
- O componente `MapaMinas` aceita TopoJSON (type="Topology") ou GeoJSON (FeatureCollection/Polygon/MultiPolygon) e já aponta para o arquivo acima por padrão.
- Para reduzir tamanho você pode converter o GeoJSON para TopoJSON (por exemplo usando `npx mapshaper`), mantendo a mesma estrutura de propriedades.

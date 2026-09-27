# Petra Sea Resort — sources and model notes

Research date: 18 September 2026.

## Primary references

- [Petra Group: Petra Sea Resort (Georgian)](https://petragroup.ge/ka/petra), [English](https://petragroup.ge/en/petra). Developer information: Tsikhisdziri, 20 hectares, approximately 15 km from Batumi; low-rise residences, apartment towers, branded residences and shared resort amenities.
- [Supplied full-resort masterplan](https://petragroup.ge/storage/CsArDhohJzWfSe3UOQCk4TSPJ0Ug1N-metacHJvamVjdC53ZWJw-.webp). Primary reference for the relative arrangement of the sculptural western landmark, three rear towers, eastern beachfront pair, low-rise buildings, lake pavilions, terraced seafront building, courts, beach and marina.
- [Official building selector](https://petragroup.ge/en/petra/blocks). Its publicly embedded building data listed A/B/C at 29 floors, Pullman A at 25 and Pullman B at 23 on the research date. D1–D4 were listed at 7 floors and K1–K6 at 4–5 floors. Only tower floor counts are directly assigned in this model; exact D/K footprints cannot be verified from the supplied axonometric image.
- [Pullman project](https://petragroup.ge/en/pullman), [Pullman building group](https://petragroup.ge/en/petra/block?group=22).
- [Render Studio project](https://render.ge/portfolio/petra-sea-resort/) and [Render Studio on Behance](https://www.behance.net/gallery/182364395/PETRA-SEA-RESORT): visualization authorship and wider architectural references.
- [SPECTRUM project](https://spectrum.ge/projects/commercial/architectural-design-petra), [SPECTRUM on Architizer](https://architizer.com/projects/petra-sea-resort/): architectural context for the paired beachfront towers.

## Locally bundled reference images

| File | Original URL |
| --- | --- |
| `masterplan.webp` | https://petragroup.ge/storage/CsArDhohJzWfSe3UOQCk4TSPJ0Ug1N-metacHJvamVjdC53ZWJw-.webp |
| `residences.webp` | https://petragroup.ge/storage/30/Project-overview-1.webp |
| `landmark.webp` | https://petragroup.ge/storage/31/Project-overview-2.webp |
| `pullman.webp` | https://petragroup.ge/storage/133/1-FINAL.webp |
| `triplets.jpg` | https://petragroup.ge/storage/314/4-(1)-(1).jpg |

These images are retained unmodified for the project's reference gallery. Copyright remains with Petra Group and the respective creators. Public availability does not imply an open license. The custom Three.js geometry does not contain a third-party 3D model.

## Reconstruction method and limits

No publicly downloadable resort GLB, glTF, OBJ or FBX model was found in the official pages or web/model searches. Visualization portfolios show rendered work rather than downloadable geometry. This is a procedural architectural interpretation, not the developer's model, a surveyed plan, construction documentation or a sales inventory.

The supplied axonometric was treated as an approximate affine projection. Visible low-rise roof centers were traced by hand, then offset using estimated building heights to infer ground positions. The source image is perspective, so this method provides relative placement, not measured footprints. The resulting scene has 34 garden residence masses, 9 small lakeside pavilions, 6 tall tower masses and one terraced seafront building: **50 individually selectable modeled structures**. This is a description of the reconstruction, not an assertion that the official project has 50 saleable blocks. Pavilions and the landmark are included to preserve the complete supplied composition.

The sculptural landmark retains the tapering glass body, vertical fins and arched crown; the low-rise residences retain rounded balcony plates and glazed façades. The Pullman pair follows the older masterplan placement and uses detailing informed by newer renders. Published imagery represents different design stages; the supplied full-resort image controls this demo's composition.

All dimensions, floor spacing, unseen elevations, shoreline, inland terrain, planting, boat positions, garden paths, lighting and furniture are approximate or illustrative. The coordinate system is local: X follows the frontage and +Z points to the sea. It is not georeferenced. There are no prices, availability claims or delivery promises in the demo.

## Runtime

Everything required to render the demo and its gallery is bundled locally. External links open primary references only when explicitly selected. The page requires WebGL 2. Repeated geometry is instanced; shadow updates and rendering stop when idle. The explicitly started guided tour, lighting transitions and automatic orbit use animation. Reduced-motion users get immediate camera and atmosphere changes.

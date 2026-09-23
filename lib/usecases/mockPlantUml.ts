/** Public demo only; project data must use the backend's renderer when integrated. */
export const MOCK_PLANT_UML = String.raw`@startuml
left to right direction
skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontName Arial
skinparam ArrowColor #555555
skinparam usecaseBackgroundColor white
skinparam usecaseBorderColor #555555
skinparam actorBorderColor #555555
skinparam packageStyle rectangle

actor Researcher as R
actor "System Administrator" as A
actor Reviewer as V

rectangle "AI Research Experimentation Platform" {
  usecase "Manage workspace\nand access" as Workspace
  usecase "Manage project\nmembers" as Members
  usecase "Upload dataset" as Upload
  usecase "Validate dataset" as Validate
  usecase "Run experiment" as Run
  usecase "Review findings" as Review
  usecase "Request human\napproval" as Approval
  usecase "Publish report" as Publish
}

R -- Workspace
A -- Members
R -- Upload
R -- Run
R -- Publish
V -- Review
Workspace ..> Members : <<include>>
Upload ..> Validate : <<include>>
Run ..> Validate : <<include>>
Approval ..> Review : <<extend>>\n[review required]
@enduml`;

// PlantUML's documented ~h format is UTF-8 encoded as hex; no compression dependency.
export const MOCK_PLANT_UML_SVG_URL = `https://www.plantuml.com/plantuml/svg/~h${Array.from(new TextEncoder().encode(MOCK_PLANT_UML), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;

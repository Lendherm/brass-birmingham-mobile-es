import { AUTHOR_GITHUB, AUTHOR_NAME, FORK_CHANGES, THIS_REPO, UPSTREAM_REPO } from '../i18n/projectMeta';

/** Créditos y atribución — solo en pantalla de inicio, no durante la partida. */
export function ProjectCredits() {
  return (
    <section className="project-credits" data-testid="project-credits" aria-labelledby="project-credits-title">
      <h3 id="project-credits-title" className="project-credits-title">
        Acerca de este proyecto
      </h3>
      <p className="project-credits-lead">
        Versión mejorada por <strong>{AUTHOR_NAME}</strong> (
        <a href={AUTHOR_GITHUB} target="_blank" rel="noreferrer">
          @{AUTHOR_GITHUB.split('/').pop()}
        </a>
        ). Basada en el{' '}
        <a href={UPSTREAM_REPO} target="_blank" rel="noreferrer">
          proyecto fan original
        </a>{' '}
        (motor de reglas en inglés).
      </p>
      <details className="project-credits-details">
        <summary>Cambios en esta versión</summary>
        <ul>
          {FORK_CHANGES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
      <p className="project-credits-disclaimer">
        Proyecto fan no oficial · Sin afiliación a Roxley Games · Variante solo Mautoma (Mauro Gibertoni).
      </p>
      <p className="project-credits-meta">
        v{__APP_VERSION__} ·{' '}
        <a href={THIS_REPO} target="_blank" rel="noreferrer" data-testid="project-repo-link">
          Código en GitHub
        </a>
      </p>
    </section>
  );
}

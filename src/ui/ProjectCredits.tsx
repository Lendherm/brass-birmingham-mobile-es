import { AUTHOR_GITHUB, AUTHOR_NAME, FORK_CHANGES, PWA_WEB_URL, THIS_REPO, UPSTREAM_REPO } from '../i18n/projectMeta';

/** Créditos y atribución — solo en pantalla de inicio, no durante la partida. */
export function ProjectCredits() {
  return (
    <section className="project-credits" data-testid="project-credits" aria-labelledby="project-credits-title">
      <h3 id="project-credits-title" className="project-credits-title">
        Acerca de este proyecto
      </h3>
      <p className="project-credits-lead">
        <strong>Brass Birmingham — Edición Móvil (ES)</strong> · versión mejorada por{' '}
        <strong>{AUTHOR_NAME}</strong> (
        <a href={AUTHOR_GITHUB} target="_blank" rel="noreferrer">
          @{AUTHOR_GITHUB.split('/').pop()}
        </a>
        ).
      </p>
      <p className="project-credits-repo">
        Repositorio público:{' '}
        <a href={THIS_REPO} target="_blank" rel="noreferrer" data-testid="project-repo-link">
          {THIS_REPO.replace('https://', '')}
        </a>
      </p>
      <p className="project-credits-repo">
        <a href={PWA_WEB_URL} target="_blank" rel="noreferrer" data-testid="project-pwa-link">
          Instalar en PC (Linux / Windows / Mac)
        </a>{' '}
        · app ligera (~3 MB) con actualizaciones automáticas
      </p>
      <p className="project-credits-repo">
        <a href={`${THIS_REPO}/releases/latest`} target="_blank" rel="noreferrer" data-testid="project-apk-link">
          Descargar APK Android
        </a>
      </p>
      <p className="project-credits-upstream">
        Basado en el{' '}
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
      <p className="project-credits-meta">v{__APP_VERSION__}</p>
    </section>
  );
}

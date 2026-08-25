import { createTranslator, resolveLocale } from './i18n';

describe('i18n', () => {
  it('translates British English keys for Spanish and Portuguese', () => {
    // Arrange
    const spanish = createTranslator('Spanish (Spain)');
    const portuguese = createTranslator('Portuguese (Brazil)');

    // Act
    const spanishFolder = spanish.t('Folder');
    const portugueseMoveFolder = portuguese.t('Move folder');

    // Assert
    expect(spanishFolder).toBe('Carpeta');
    expect(portugueseMoveFolder).toBe('Mover pasta');
  });

  it('falls back to the system locale before English (United Kingdom)', () => {
    // Arrange
    const systemLocale = ['pt-BR'];

    // Act
    const resolved = resolveLocale(null, systemLocale);
    const translator = createTranslator(null, systemLocale);
    const translated = translator.t('New folder');

    // Assert
    expect(resolved).toBe('pt-BR');
    expect(translated).toBe('Nova pasta');
  });

  it('falls back to English (United Kingdom) when nothing matches', () => {
    // Arrange
    const systemLocale = ['zz-ZZ'];

    // Act
    const resolved = resolveLocale(null, systemLocale);
    const translated = createTranslator(null, systemLocale).t('Folder');

    // Assert
    expect(resolved).toBe('en-GB');
    expect(translated).toBe('Folder');
  });

  it('returns the British English phrase when no translation exists', () => {
    // Arrange
    const translator = createTranslator('Spanish (Spain)');

    // Act
    const translated = translator.t('Untranslated phrase');

    // Assert
    expect(translated).toBe('Untranslated phrase');
  });

  it('replaces placeholders with provided values', () => {
    // Arrange
    const translator = createTranslator('Spanish (Spain)');

    // Act
    const translated = translator.t('This value is {totalCount}', {
      totalCount: 3,
    });

    // Assert
    expect(translated).toBe('Este valor es 3');
  });

  it('replaces placeholders in British English fallback', () => {
    // Arrange
    const translator = createTranslator('en-GB');

    // Act
    const translated = translator.t('This value is {totalCount}', {
      totalCount: 42,
    });

    // Assert
    expect(translated).toBe('This value is 42');
  });

  it('translates Canadian English returns key as-is', () => {
    // Arrange
    const translator = createTranslator('en-CA');

    // Act
    const folder = translator.t('Folder');
    const newFolder = translator.t('New folder');

    // Assert
    expect(folder).toBe('Folder');
    expect(newFolder).toBe('New folder');
  });

  it('translates settings and notes chrome for Spanish', () => {
    // Arrange
    const translator = createTranslator('es-ES');

    // Act
    const settings = translator.t('Settings');
    const appearance = translator.t('Appearance');
    const shortcuts = translator.t('Shortcuts');
    const noteGraph = translator.t('Note Graph');

    // Assert
    expect(settings).toBe('Ajustes');
    expect(appearance).toBe('Apariencia');
    expect(shortcuts).toBe('Atajos');
    expect(noteGraph).toBe('Grafo de notas');
  });

  it('translates Canadian French correctly', () => {
    // Arrange
    const translator = createTranslator('fr-CA');

    // Act
    const folder = translator.t('Folder');
    const newFolder = translator.t('New folder');
    const cancel = translator.t('Cancel');

    // Assert
    expect(folder).toBe('Dossier');
    expect(newFolder).toBe('Nouveau dossier');
    expect(cancel).toBe('Annuler');
  });

  it('translates auth card titles', () => {
    // Arrange
    const spanish = createTranslator('es-ES');
    const portuguese = createTranslator('pt-BR');
    const french = createTranslator('fr-CA');

    // Act
    const spanishSignIn = spanish.t('Sign in');
    const portugueseSignUp = portuguese.t('Sign up');
    const frenchSignIn = french.t('Sign in');

    // Assert
    expect(spanishSignIn).toBe('Iniciar sesión');
    expect(portugueseSignUp).toBe('Criar conta');
    expect(frenchSignIn).toBe('Connexion');
    expect(spanish.t('Enter your email to sign in.')).toBe(
      'Introduce tu correo para iniciar sesión.',
    );
    expect(portuguese.t('Enter your email to create an account.')).toBe(
      'Digite seu e-mail para criar uma conta.',
    );
  });

  it('resolves Canadian locales from system', () => {
    // Arrange
    const systemLocale = ['fr-CA'];

    // Act
    const resolved = resolveLocale(null, systemLocale);
    const translator = createTranslator(null, systemLocale);
    const translated = translator.t('Create');

    // Assert
    expect(resolved).toBe('fr-CA');
    expect(translated).toBe('Créer');
  });
});

import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'es' | 'en';

const TRANSLATIONS: Record<string, Record<Lang, string>> = {
    // Nav
    'nav.ranking': { es: 'Ranking', en: 'Ranking' },
    'nav.register': { es: 'Registrar', en: 'Register' },
    'nav.createNft': { es: 'Crear NFT', en: 'Create NFT' },
    'nav.verify': { es: 'Verificar', en: 'Verify' },
    'nav.tools': { es: 'Herramientas', en: 'Tools' },
    'nav.darkMode': { es: 'Modo oscuro', en: 'Dark mode' },
    'nav.lightMode': { es: 'Modo claro', en: 'Light mode' },

    // Hero
    'hero.title': { es: 'Prueba de Autoría Humana para Música con IA', en: 'Human Authorship Proof for AI Music' },
    'hero.subtitle': {
        es: 'Documenta tu proceso creativo con Suno/Udio en blockchain. Cumple con el Copyright Office, protege tu derecho a monetizar y demuestra tu "control creativo significativo".',
        en: 'Document your creative process with Suno/Udio on blockchain. Comply with the Copyright Office, protect your right to monetize, and prove your "significant creative control".'
    },

    // How it works
    'howItWorks.title': { es: '¿Cómo funciona?', en: 'How does it work?' },
    'howItWorks.step1.title': { es: 'Genera con IA', en: 'Generate with AI' },
    'howItWorks.step1.desc': { es: 'Crea tu canción en Suno/Udio. Guarda el prompt exacto que usaste y las variaciones que la IA generó para ti.', en: 'Create your song in Suno/Udio. Save the exact prompt you used and the variations the AI generated for you.' },
    'howItWorks.step2.title': { es: 'Documenta tu aporte', en: 'Document your input' },
    'howItWorks.step2.desc': { es: 'Registra tu prompt, selecciones y ediciones. Esto prueba tu "autoría humana significativa" para el Copyright Office.', en: 'Record your prompt, selections, and edits. This proves your "significant human authorship" for the Copyright Office.' },
    'howItWorks.step3.title': { es: 'Sella en blockchain', en: 'Seal on blockchain' },
    'howItWorks.step3.desc': { es: 'Cada paso genera un hash con timestamp inmutable. Tu evidencia creativa queda protegida para siempre.', en: 'Each step generates a hash with an immutable timestamp. Your creative evidence is protected forever.' },
    'howItWorks.step4.title': { es: 'Certificado de autoría', en: 'Authorship certificate' },
    'howItWorks.step4.desc': { es: 'Descarga un PDF con toda tu cadena de evidencia: prompts, variaciones, selecciones y ediciones humanas.', en: 'Download a PDF with your entire evidence chain: prompts, variations, selections, and human edits.' },

    // CTA
    'cta.startRegistration': { es: 'Comenzar registro →', en: 'Start registration →' },
    'cta.verifyIdea': { es: 'Verificar una idea', en: 'Verify an idea' },

    // Loading
    'loading.ranking': { es: 'Cargando ranking...', en: 'Loading ranking...' },

    // Leaderboard
    'leaderboard.topArtists': { es: 'Top artistas', en: 'Top artists' },
    'leaderboard.integrityScore': { es: 'Puntaje de Integridad', en: 'Integrity Score' },
    'leaderboard.otherArtists': { es: 'Registros de Evidencia Creativa', en: 'Creative Evidence Records' },
    'leaderboard.noArtists': { es: 'Aún no hay artistas registrados', en: 'No artists registered yet' },
    'leaderboard.beFirst': { es: 'Sé el primero en registrar tu proceso creativo', en: 'Be the first to register your creative process' },

    // Info modals
    'modal.leaderboard.title': { es: '🏆 ¿Qué es el Ranking?', en: '🏆 What is the Ranking?' },
    'modal.leaderboard.p1': { es: 'El Ranking de Integridad muestra a los artistas que mejor documentan su proceso creativo con IA.', en: 'The Integrity Ranking shows artists who best document their creative process with AI.' },
    'modal.leaderboard.p2': { es: 'No se trata de quién hace más música, sino de quién demuestra mejor su autoría humana ante el Copyright Office.', en: "It's not about who makes the most music, but who best demonstrates their human authorship before the Copyright Office." },
    'modal.leaderboard.purpose': { es: '¿Para qué sirve?', en: 'What is it for?' },
    'modal.leaderboard.item1': { es: 'Visibiliza a los artistas más comprometidos con la transparencia', en: 'Highlights artists most committed to transparency' },
    'modal.leaderboard.item2': { es: 'Genera reputación verificable para plataformas como Spotify y YouTube', en: 'Builds verifiable reputation for platforms like Spotify and YouTube' },
    'modal.leaderboard.item3': { es: 'Demuestra que tu música con IA tiene "control creativo significativo"', en: 'Proves your AI music has "significant creative control"' },
    'modal.leaderboard.item4': { es: 'Te posiciona como artista serio en el ecosistema de música + IA', en: 'Positions you as a serious artist in the music + AI ecosystem' },

    'modal.score.title': { es: '📊 ¿Cómo se calcula el puntaje?', en: '📊 How is the score calculated?' },
    'modal.score.p1': { es: 'El Puntaje de Integridad refleja cuánta evidencia de autoría humana has registrado on-chain:', en: 'The Integrity Score reflects how much human authorship evidence you have registered on-chain:' },
    'modal.score.formula': { es: 'Puntaje = (Mints × 1,000) + (Verificaciones recibidas × 500) + (Verificaciones dadas × 200)', en: 'Score = (Mints × 1,000) + (Verifications received × 500) + (Verifications given × 200)' },
    'modal.score.mints': { es: 'Mints (×1,000)', en: 'Mints (×1,000)' },
    'modal.score.mintsDesc': { es: 'Cada idea musical que registras con su audio hash.', en: 'Each musical idea you register with its audio hash.' },
    'modal.score.verifRecv': { es: 'Verificaciones Recibidas (×500)', en: 'Verifications Received (×500)' },
    'modal.score.verifRecvDesc': { es: 'Cuando otros artistas verifican que tu proceso es legítimo.', en: 'When other artists verify your process is legitimate.' },
    'modal.score.verifGiven': { es: 'Verificaciones Dadas (×200)', en: 'Verifications Given (×200)' },
    'modal.score.verifGivenDesc': { es: 'Cuando verificas el proceso de otros artistas (contribuir da puntos).', en: 'When you verify other artists\' process (contributing earns points).' },
    'modal.understood': { es: 'Entendido', en: 'Got it' },

    // Features
    'features.title': { es: '¿Qué ofrece 0xSonata?', en: 'What does 0xSonata offer?' },
    'features.subtitle': { es: 'Cuatro capas de protección para tu música', en: 'Four layers of protection for your music' },
    'features.f1.title': { es: 'Proceso Creativo con IA', en: 'AI Creative Process' },
    'features.f1.desc': { es: 'Registra cada paso: tu prompt en Suno/Udio, las variaciones que generaste, cuál elegiste y por qué, y las ediciones humanas en tu DAW. Esto es lo que el Copyright Office llama "autoría humana significativa".', en: 'Record every step: your prompt in Suno/Udio, the variations you generated, which one you chose and why, and the human edits in your DAW. This is what the Copyright Office calls "significant human authorship".' },
    'features.f2.title': { es: 'Evidencia Inmutable', en: 'Immutable Evidence' },
    'features.f2.desc': { es: 'Cada paso genera un hash SHA-256 con timestamp en blockchain. Nadie puede alterar tu registro. Tu evidencia de autoría humana existe para siempre.', en: 'Each step generates a SHA-256 hash with a blockchain timestamp. Nobody can alter your record. Your human authorship evidence exists forever.' },
    'features.f3.title': { es: 'Reputación Verificada', en: 'Verified Reputation' },
    'features.f3.desc': { es: 'Acumula verificaciones de otros artistas que confirman tu proceso creativo. Sube de nivel: Emergente → Bronce → Plata → Oro. Tu reputación te precede.', en: 'Accumulate verifications from other artists who confirm your creative process. Level up: Emerging → Bronze → Silver → Gold. Your reputation precedes you.' },
    'features.f4.title': { es: 'Colaboraciones Claras', en: 'Clear Collaborations' },
    'features.f4.desc': { es: 'Tú registras tus letras, tu colaborador registra su instrumental con IA. Luego crean un Project Vault con splits definidos (ej: 50%-50%). Pagos automáticos, sin peleas.', en: 'You register your lyrics, your collaborator registers their AI instrumental. Then you create a Project Vault with defined splits (e.g., 50%-50%). Automatic payments, no disputes.' },

    // Personas
    'personas.title': { es: '¿Te identificas?', en: 'Can you relate?' },
    'personas.subtitle': { es: 'Historias reales de artistas que necesitan proteger su trabajo', en: 'Real stories of artists who need to protect their work' },
    'personas.with0xSonata': { es: 'Con 0xSonata → ', en: 'With 0xSonata → ' },

    // Jake persona
    'persona.jake.problem_title': { es: 'Generó 50 canciones en Suno, no puede copyrightear ninguna', en: 'Generated 50 songs in Suno, can\'t copyright any of them' },
    'persona.jake.problem': { es: 'Usa Suno Pro ($30/mes) para crear beats de reggaeton. Sube 3 canciones semanales a Spotify pero leyó que "música 100% IA no tiene copyright". Teme que alguien más registre SUS canciones y le quite las regalías. No puede pagar $45 por registro en Copyright Office.', en: 'Uses Suno Pro ($30/mo) to create reggaeton beats. Uploads 3 songs weekly to Spotify but read that "100% AI music has no copyright". Fears someone else will register HIS songs and take the royalties. Can\'t afford $45 per Copyright Office registration.' },
    'persona.jake.solution': { es: 'Registra cada paso: prompt exacto en Suno, las 10 variaciones que generó, por qué eligió la #7, edición de vocales en GarageBand. Certificado PDF muestra "autoría humana significativa". Spotify acepta su evidencia.', en: 'Records every step: exact prompt in Suno, the 10 variations generated, why he chose #7, vocal editing in GarageBand. PDF certificate shows "significant human authorship". Spotify accepts his evidence.' },

    // Valeria persona
    'persona.valeria.problem_title': { es: 'YouTube le quitó monetización por "contenido IA"', en: 'YouTube removed monetization for "AI content"' },
    'persona.valeria.problem': { es: 'Compositora para medios que usa Udio para demos rápidos. YouTube le marcó 15 videos como "contenido generado por IA" sin monetización. El Copyright Office de EE.UU. le pidió prueba de "aporte humano significativo" para registrar su banda sonora.', en: 'Media composer who uses Udio for quick demos. YouTube flagged 15 videos as "AI-generated content" without monetization. The US Copyright Office asked for proof of "significant human contribution" to register her soundtrack.' },
    'persona.valeria.solution': { es: 'Registra prompts, screenshots de variaciones en Udio, archivos de proyecto de Ableton con ediciones humanas. Certificado 0xSonata prueba que transformó material IA. YouTube restaura monetización, Copyright Office acepta registro.', en: 'Records prompts, screenshots of Udio variations, Ableton project files with human edits. 0xSonata certificate proves she transformed AI material. YouTube restores monetization, Copyright Office accepts registration.' },

    // Andrés & Camila persona
    'persona.collab.problem_title': { es: 'Colaboración IA + Humana sin acuerdo de splits', en: 'AI + Human collaboration without split agreement' },
    'persona.collab.problem': { es: 'Camila escribe letras, Andrés genera instrumentales con Suno. Lanzan EP de 6 tracks en DistroKid pero no acordaron porcentajes. Andrés quiere usar 2 tracks para proyecto solista. Camila dice que sus letras son 50% del valor. No tienen contrato escrito.', en: 'Camila writes lyrics, Andrés generates instrumentals with Suno. They release a 6-track EP on DistroKid but didn\'t agree on percentages. Andrés wants to use 2 tracks for a solo project. Camila says her lyrics are 50% of the value. They have no written contract.' },
    'persona.collab.solution': { es: 'Camila registra sus letras (Token #12), Andrés registra su instrumental IA (Token #13). Crean Project Vault con split 50%-50% on-chain. DistroKid paga a la wallet del Vault, smart contract distribuye automáticamente.', en: 'Camila registers her lyrics (Token #12), Andrés registers his AI instrumental (Token #13). They create a Project Vault with 50%-50% split on-chain. DistroKid pays to the Vault wallet, smart contract distributes automatically.' },

    // Register view
    'register.breadcrumb.home': { es: 'Inicio', en: 'Home' },
    'register.breadcrumb.current': { es: 'Registrar proceso', en: 'Register process' },
    'register.title': { es: 'Evidencia de Autoría Humana', en: 'Human Authorship Evidence' },
    'register.subtitle': { es: 'Documenta tu proceso creativo con IA para el Copyright Office', en: 'Document your AI creative process for the Copyright Office' },
    'register.projectName': { es: 'Nombre del Proyecto', en: 'Project Name' },
    'register.projectPlaceholder': { es: 'Ej: Neon Reggaeton Beat', en: 'E.g.: Neon Reggaeton Beat' },
    'register.stepsLabel': { es: 'Pasos del Proceso', en: 'Process Steps' },
    'register.completed': { es: 'Completado', en: 'Completed' },
    'register.link': { es: 'Vincular', en: 'Link' },
    'register.integrity': { es: 'Integridad', en: 'Integrity' },
    'register.weakEvidence': { es: 'Evidencia débil', en: 'Weak evidence' },
    'register.strongEvidence': { es: 'Evidencia fuerte', en: 'Strong evidence' },
    'register.steps': { es: 'pasos', en: 'steps' },
    'register.goRegister': { es: 'Ir a registrar on-chain →', en: 'Go register on-chain →' },
    'register.backToRanking': { es: '← Volver al Ranking', en: '← Back to Ranking' },

    // Register steps
    'step.0': { es: 'Prompt en Suno/Udio', en: 'Prompt in Suno/Udio' },
    'step.1': { es: 'Variaciones IA Generadas', en: 'AI Generated Variations' },
    'step.2': { es: 'Tu Selección (decisión humana)', en: 'Your Selection (human decision)' },
    'step.3': { es: 'Edición DAW (aporte humano)', en: 'DAW Editing (human input)' },
    'step.4': { es: 'Master Final', en: 'Final Master' },

    // Footer
    'footer.chain': { es: 'Cadena de Evidencia Creativa', en: 'Creative Evidence Chain' },
    'footer.network': { es: 'Desplegado en zkSYS PoB Devnet (Chain ID 57042) · Código abierto', en: 'Deployed on zkSYS PoB Devnet (Chain ID 57042) · Open source' },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
    private readonly _lang = signal<Lang>(this.getInitialLang());

    readonly lang = this._lang.asReadonly();
    readonly isEnglish = computed(() => this._lang() === 'en');

    private getInitialLang(): Lang {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('0xsonata-lang') as Lang;
            if (saved === 'en' || saved === 'es') return saved;
        }
        return 'en';
    }

    toggle(): void {
        const next: Lang = this._lang() === 'es' ? 'en' : 'es';
        this._lang.set(next);
        if (typeof window !== 'undefined') {
            localStorage.setItem('0xsonata-lang', next);
        }
    }

    setLang(lang: Lang): void {
        this._lang.set(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('0xsonata-lang', lang);
        }
    }

    t(key: string): string {
        const entry = TRANSLATIONS[key];
        if (!entry) return key;
        return entry[this._lang()] || entry['es'] || key;
    }
}

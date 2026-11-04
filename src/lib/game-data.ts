// Solo datos públicos. El banco de preguntas se consulta exclusivamente en el servidor.
export * from "./rules";
export type { GameResult, ScoreRecord, Outcome } from "./contracts";

// ─────────────────────────────────────────────────────────────
// Banco de extractos de la portada. Añade objetos { text, ref } para ampliar
// la rotación automática sin cambiar el componente visual.
// AMPLIADO con: corona de justicia, corona de vida, corona de gloria, el camino,
// la sabiduría, escudriñar las Escrituras, consejos de sabiduría, beneficios de
// la perseverancia, determinación y la sabiduría como identidad de Jesús.
// Redacción: Reina-Valera 1960.
// ─────────────────────────────────────────────────────────────

export interface ScriptureVerse {
  text: string;
  ref: string;
}

export const SCRIPTURE_ROTATION: ScriptureVerse[] = [
  // ── EXISTENTES (nota: el texto original corresponde a Proverbios 1:7) ──
  { text: "El principio de la sabiduría es el temor de Jehová; los insensatos desprecian la sabiduría y la enseñanza.", ref: "Proverbios 1:7" },
  { text: "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.", ref: "Salmos 119:105" },
  { text: "Bienaventurado el hombre que halla la sabiduría, y que obtiene la inteligencia.", ref: "Proverbios 3:13" },

  // ── CORONA DE JUSTICIA / CORONA DE VIDA / CORONA DE GLORIA ──
  { text: "He peleado la buena batalla, he acabado la carrera, he guardado la fe. Por lo demás, me está guardada la corona de justicia, la cual me dará el Señor, juez justo, en aquel día.", ref: "2 Timoteo 4:7-8" },
  { text: "Bienaventurado el varón que soporta la tentación; porque cuando haya resistido la prueba, recibirá la corona de vida, que Dios ha prometido a los que le aman.", ref: "Santiago 1:12" },
  { text: "Sé fiel hasta la muerte, y yo te daré la corona de la vida.", ref: "Apocalipsis 2:10" },
  { text: "Y cuando aparezca el Príncipe de los pastores, recibiréis la corona incorruptible de gloria.", ref: "1 Pedro 5:4" },
  { text: "He aquí, yo vengo pronto; retén lo que tienes, para que ninguno tome tu corona.", ref: "Apocalipsis 3:11" },
  { text: "Ellos, a la verdad, para recibir una corona corruptible; pero nosotros, una incorruptible.", ref: "1 Corintios 9:25" },
  { text: "Prosigo a la meta, al premio del llamamiento celestial de Dios en Cristo Jesús.", ref: "Filipenses 3:14" },
  { text: "El que rescata del hoyo tu vida, el que te corona de favores y misericordias.", ref: "Salmos 103:4" },
  { text: "He aquí yo vengo pronto, y mi recompensa está conmigo, para recompensar a cada uno según sea su obra.", ref: "Apocalipsis 22:12" },

  // ── EL CAMINO ──
  { text: "Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.", ref: "Juan 14:6" },
  { text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.", ref: "Proverbios 3:5-6" },
  { text: "Porque angosta es la puerta, y estrecho el camino que lleva a la vida, y pocos son los que la hallan.", ref: "Mateo 7:14" },
  { text: "Me mostrarás la senda de la vida; en tu presencia hay plenitud de gozo; delicias a tu diestra para siempre.", ref: "Salmos 16:11" },
  { text: "Por Jehová son ordenados los pasos del hombre, y él aprueba su camino.", ref: "Salmos 37:23" },
  { text: "Mas la senda de los justos es como la luz de la aurora, que va en aumento hasta que el día es perfecto.", ref: "Proverbios 4:18" },
  { text: "Entonces tus oídos oirán a tus espaldas palabra que diga: Este es el camino, andad por él.", ref: "Isaías 30:21" },
  { text: "Y allí habrá calzada y camino, y será llamado camino de santidad.", ref: "Isaías 35:8" },
  { text: "Paraos en los caminos, y mirad, y preguntad por las sendas antiguas, cuál sea el buen camino, y andad por él, y hallaréis descanso para vuestra alma.", ref: "Jeremías 6:16" },
  { text: "El que dice que permanece en él, debe andar como él anduvo.", ref: "1 Juan 2:6" },
  { text: "Pensé en mis caminos, y volví mis pies a tus testimonios.", ref: "Salmos 119:59" },

  // ── LA SABIDURÍA ──
  { text: "Porque Jehová da la sabiduría, y de su boca viene el conocimiento y la inteligencia.", ref: "Proverbios 2:6" },
  { text: "Sabiduría ante todo; adquiere sabiduría; y sobre todas tus posesiones adquiere inteligencia.", ref: "Proverbios 4:7" },
  { text: "Porque la sabiduría es mejor que las piedras preciosas, y todas las cosas que se pueden desear no se pueden comparar con ella.", ref: "Proverbios 8:11" },
  { text: "Mejor es adquirir sabiduría que el oro fino, y adquirir inteligencia vale más que la plata.", ref: "Proverbios 16:16" },
  { text: "El temor de Jehová es la instrucción de la sabiduría; y a la honra precede la humildad.", ref: "Proverbios 15:33" },
  { text: "Porque por medio de mí se multiplicarán tus días, y te serán añadidos años de vida.", ref: "Proverbios 9:11" },
  { text: "El fruto del justo es árbol de vida, y el que gana almas es sabio.", ref: "Proverbios 11:30" },
  { text: "Enséñanos de tal modo a contar nuestros días, que traigamos al corazón la sabiduría.", ref: "Salmos 90:12" },
  { text: "He aquí, el temor del Señor es la sabiduría, y el apartarse del mal, la inteligencia.", ref: "Job 28:28" },
  { text: "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.", ref: "Santiago 1:5" },
  { text: "Mas la sabiduría que es de lo alto es primeramente pura, después pacífica, amable, benigna, llena de misericordia y de buenos frutos.", ref: "Santiago 3:17" },
  { text: "Así será a tu alma el conocimiento de la sabiduría; si la hallares, tendrás recompensa, y al fin tu esperanza no será cortada.", ref: "Proverbios 24:14" },

  // ── ESCRUDRIÑAR LAS ESCRITURAS ──
  { text: "Escudriñad las Escrituras; porque a vosotros os parece que en ellas tenéis la vida eterna; y ellas son las que dan testimonio de mí.", ref: "Juan 5:39" },
  { text: "Recibieron la palabra con toda solicitud, escudriñando cada día las Escrituras para ver si estas cosas eran así.", ref: "Hechos 17:11" },
  { text: "En mi corazón he guardado tus dichos, para no pecar contra ti.", ref: "Salmos 119:11" },
  { text: "Descubre mis ojos, para que contemple las maravillas de tu ley.", ref: "Salmos 119:18" },
  { text: "La exposición de tus palabras alumbra; hace entender a los simples.", ref: "Salmos 119:130" },
  { text: "En la ley de Jehová está su delicia, y en su ley medita de día y de noche. Será como árbol plantado junto a corrientes de aguas, que da su fruto en su tiempo.", ref: "Salmos 1:2-3" },
  { text: "El libro de la ley no se apartará de tu boca, sino que meditarás en él día y noche, para que guards y hagas conforme a todo lo que en él está escrito; porque entonces harás prosperar tu camino, y todo te saldrá bien.", ref: "Josué 1:8" },
  { text: "Procura con diligencia presentarte a Dios aprobado, como obrero que no tiene de qué avergonzarse, que usa bien la palabra de verdad.", ref: "2 Timoteo 2:15" },
  { text: "Toda la Escritura es inspirada por Dios, y útil para enseñar, para redargüir, para corregir, para instruir en justicia, a fin de que el hombre de Dios sea perfecto, enteramente preparado para toda buena obra.", ref: "2 Timoteo 3:16-17" },
  { text: "Las cosas que se escribieron antes, para nuestra enseñanza se escribieron, a fin de que por la paciencia y la consolación de las Escrituras, tengamos esperanza.", ref: "Romanos 15:4" },
  { text: "¿No arde nuestro corazón en nosotros, cuando nos hablaba en el camino, y cuando nos abría las Escrituras?", ref: "Lucas 24:32" },

  // ── CONSEJOS DE SABIDURÍA ──
  { text: "Oirá el sabio, y aumentará el saber, y el entendido adquirirá consejo.", ref: "Proverbios 1:5" },
  { text: "Donde no hay consejo, cae el pueblo; mas en la multitud de consejeros hay seguridad.", ref: "Proverbios 11:14" },
  { text: "El camino del necio es derecho en su opinión; mas el que obedece al consejo es sabio.", ref: "Proverbios 12:15" },
  { text: "Los pensamientos son frustrados donde no hay consejo; mas en la multitud de consejeros se afirman.", ref: "Proverbios 15:22" },
  { text: "Escucha el consejo, y recibe la corrección, para que seas sabio en tu vejez.", ref: "Proverbios 19:20" },
  { text: "Con estratagemas harás la guerra, y en la multitud de consejeros está la victoria.", ref: "Proverbios 24:6" },
  { text: "El ungüento y el perfume alegran el corazón, y el cordial consejo del amigo, al hombre.", ref: "Proverbios 27:9" },
  { text: "Los testimonios son también mis delicias y mis consejeros.", ref: "Salmos 119:24" },

  // ── BENEFICIOS DE LA PERSEVERANCIA ──
  { text: "Nos gloriamos en las tribulaciones, sabiendo que la tribulación produce paciencia; y la paciencia, prueba; y la prueba, esperanza.", ref: "Romanos 5:3-4" },
  { text: "La prueba de vuestra fe produce paciencia. Mas tenga la paciencia su obra completa, para que seáis perfectos y cabales, sin que os falte cosa alguna.", ref: "Santiago 1:3-4" },
  { text: "No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.", ref: "Gálatas 6:9" },
  { text: "Porque os es necesaria la paciencia, para que, habiendo hecho la voluntad de Dios, obtengáis la promesa.", ref: "Hebreos 10:36" },
  { text: "Corramos con paciencia la carrera que tenemos por delante.", ref: "Hebreos 12:1" },
  { text: "Estad firmes y constantes, creciendo en la obra del Señor siempre, sabiendo que vuestro trabajo en el Señor no es en vano.", ref: "1 Corintios 15:58" },
  { text: "En vuestra paciencia poseeréis vuestras almas.", ref: "Lucas 21:19" },
  { text: "Mas los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.", ref: "Isaías 40:31" },
  { text: "No seáis perezosos, sino imitadores de los que por la fe y la paciencia heredan las promesas.", ref: "Hebreos 6:12" },
  { text: "Fortalecidos con todo poder, conforme a la potencia de su gloria, para toda paciencia y longanimidad.", ref: "Colosenses 1:11" },

  // ── DETERMINACIÓN ──
  { text: "Y Daniel propuso en su corazón no contaminarse con la porción de la comida del rey, ni con el vino que él bebía.", ref: "Daniel 1:8" },
  { text: "Escogeos hoy a quién sirváis; pero yo y mi casa serviremos a Jehová.", ref: "Josué 24:15" },
  { text: "A donde tú fueres iré yo, y donde tú vivieres, viviré; tu pueblo será mi pueblo, y tu Dios, mi Dios.", ref: "Rut 1:16" },
  { text: "De nada hace caso mi vida, ni la tengo preciosa para mí mismo, con tal que acabe mi carrera con gozo, y el ministerio que recibí del Señor Jesús.", ref: "Hechos 20:24" },
  { text: "Yo estoy haciendo una gran obra y no puedo descender.", ref: "Nehemías 6:3" },
  { text: "Porque Esdras había preparado su corazón para inquirir la ley de Jehová y para cumplirla, y para enseñar en Israel sus estatutos y decretos.", ref: "Esdras 7:10" },
  { text: "Estando confiado de esto, que el que comenzó en vosotros la buena obra la perfeccionará hasta el día de Jesucristo.", ref: "Filipenses 1:6" },
  { text: "Puestos los ojos en Jesús, el autor y consumador de la fe.", ref: "Hebreos 12:2" },

  // ── LA SABIDURÍA COMO IDENTIDAD DE JESÚS ──
  { text: "A los llamados, así judíos como griegos, Cristo poder de Dios, y sabiduría de Dios.", ref: "1 Corintios 1:24" },
  { text: "Mas por él estáis vosotros en Cristo Jesús, el cual nos ha sido hecho por Dios sabiduría, justificación, santificación y redención.", ref: "1 Corintios 1:30" },
  { text: "En quien están escondidos todos los tesoros de la sabiduría y del conocimiento.", ref: "Colosenses 2:3" },
  { text: "Y reposará sobre él el Espíritu de Jehová; espíritu de sabiduría e inteligencia, espíritu de consejo y de poder, espíritu de conocimiento y de temor de Jehová.", ref: "Isaías 11:2" },
  { text: "Porque un niño nos es nacido, hijo nos es dado, y el principado sobre su hombro; y se llamará su nombre Admirable, Consejero, Dios Fuerte, Padre Eterno, Príncipe de Paz.", ref: "Isaías 9:6" },
  { text: "Y el niño crecía y se fortalecía, y se llenaba de sabiduría; y la gracia de Dios era sobre él.", ref: "Lucas 2:40" },
  { text: "Y Jesús crecía en sabiduría y en estatura, y en gracia para con Dios y los hombres.", ref: "Lucas 2:52" },
  { text: "¿De dónde tiene éste esta sabiduría y estos milagros?", ref: "Mateo 13:54" },
  { text: "Jehová me poseía en el principio de su camino, antes de sus obras más antiguas.", ref: "Proverbios 8:22" },
];

// ─────────────────────────────────────────────────────────────
// Aleatorización de la rotación
// El orden en que se muestran lo decide el componente que consume
// SCRIPTURE_ROTATION. Estos helpers están listos para usar:
// ─────────────────────────────────────────────────────────────

/** Mezcla el banco con Fisher–Yates y devuelve un "mazo" nuevo
 *  (no altera el arreglo original). Recorre el mazo completo sin
 *  repetir antes de terminar el ciclo. */
export function shuffleScriptures(): ScriptureVerse[] {
  const deck = [...SCRIPTURE_ROTATION];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Devuelve un versículo aleatorio. Si se pasa notThisRef, intenta
 *  evitar devolver el mismo que se mostró anteriormente. */
export function randomScripture(notThisRef?: string): ScriptureVerse {
  let verse = SCRIPTURE_ROTATION[Math.floor(Math.random() * SCRIPTURE_ROTATION.length)];
  if (notThisRef && SCRIPTURE_ROTATION.length > 1) {
    let guard = 0;
    while (verse.ref === notThisRef && guard++ < 8) {
      verse = SCRIPTURE_ROTATION[Math.floor(Math.random() * SCRIPTURE_ROTATION.length)];
    }
  }
  return verse;
}

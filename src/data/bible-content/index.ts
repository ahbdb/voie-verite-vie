// Index de tous les livres bibliques
// Généré automatiquement - ne pas modifier manuellement

import genesis from './01-genesis.json';
import exodus from './02-exodus.json';
import leviticus from './03-leviticus.json';
import numbers from './04-numbers.json';
import deuteronomy from './05-deuteronomy.json';
import joshua from './06-joshua.json';
import judges from './07-judges.json';
import ruth from './08-ruth.json';
import samuel1 from './09-1-samuel.json';
import samuel2 from './10-2-samuel.json';
import kings1 from './11-1-kings.json';
import kings2 from './12-2-kings.json';
import chronicles1 from './13-1-chronicles.json';
import chronicles2 from './14-2-chronicles.json';
import ezra from './15-ezra.json';
import nehemiah from './16-nehemiah.json';
import esther from './17-esther.json';
import job from './18-job.json';
import psalms from './19-psalms.json';
import proverbs from './20-proverbs.json';
import ecclesiastes from './21-ecclesiastes.json';
import songOfSongs from './22-song-of-solomon.json';
import isaiah from './23-isaiah.json';
import jeremiah from './24-jeremiah.json';
import lamentations from './25-lamentations.json';
import ezekiel from './26-ezekiel.json';
import daniel from './27-daniel.json';
import hosea from './28-hosea.json';
import joel from './29-joel.json';
import amos from './30-amos.json';
import obadiah from './31-obadiah.json';
import jonah from './32-jonah.json';
import micah from './33-micah.json';
import nahum from './34-nahum.json';
import habakkuk from './35-habakkuk.json';
import zephaniah from './36-zephaniah.json';
import haggai from './37-haggai.json';
import zechariah from './38-zechariah.json';
import malachi from './39-malachi.json';
import baruch from './40-baruch.json';
import tobit from './41-tobit.json';
import judith from './42-judith.json';
import maccabees1 from './43-1-maccabees.json';
import maccabees2 from './44-2-maccabees.json';
import wisdom from './45-wisdom.json';
import sirach from './46-sirach.json';
import matthew from './47-matthew.json';
import mark from './48-mark.json';
import luke from './49-luke.json';
import john from './50-john.json';
import acts from './51-acts.json';
import romans from './52-romans.json';
import corinthians1 from './53-1-corinthians.json';
import corinthians2 from './54-2-corinthians.json';
import galatians from './55-galatians.json';
import ephesians from './56-ephesians.json';
import philippians from './57-philippians.json';
import colossians from './58-colossians.json';
import thessalonians1 from './59-1-thessalonians.json';
import thessalonians2 from './60-2-thessalonians.json';
import timothy1 from './61-1-timothy.json';
import timothy2 from './62-2-timothy.json';
import titus from './63-titus.json';
import philemon from './64-philemon.json';
import hebrews from './65-hebrews.json';
import james from './66-james.json';
import peter1 from './67-1-peter.json';
import peter2 from './68-2-peter.json';
import john1 from './69-1-john.json';
import john2 from './70-2-john.json';
import john3 from './71-3-john.json';
import jude from './72-jude.json';
import revelation from './73-revelation.json';

export const bibleContent: Record<string, any> = {
  genesis, exodus, leviticus, numbers, deuteronomy, joshua, judges, ruth,
  samuel1, samuel2, kings1, kings2, chronicles1, chronicles2, ezra, nehemiah,
  esther, job, psalms, proverbs, ecclesiastes, songOfSongs, isaiah, jeremiah,
  lamentations, ezekiel, daniel, hosea, joel, amos, obadiah, jonah, micah, nahum,
  habakkuk, zephaniah, haggai, zechariah, malachi, baruch, tobit, judith,
  maccabees1, maccabees2, wisdom, sirach, matthew, mark, luke, john, acts,
  romans, corinthians1, corinthians2, galatians, ephesians, philippians,
  colossians, thessalonians1, thessalonians2, timothy1, timothy2, titus,
  philemon, hebrews, james, peter1, peter2, john1, john2, john3, jude, revelation,
};

// Map fileName to module key
export const fileNameMap: Record<string, string> = {
  'genesis': 'genesis',
  'exodus': 'exodus',
  'leviticus': 'leviticus',
  'numbers': 'numbers',
  'deuteronomy': 'deuteronomy',
  'joshua': 'joshua',
  'judges': 'judges',
  'ruth': 'ruth',
  '1-samuel': 'samuel1',
  '2-samuel': 'samuel2',
  '1-kings': 'kings1',
  '2-kings': 'kings2',
  '1-chronicles': 'chronicles1',
  '2-chronicles': 'chronicles2',
  'ezra': 'ezra',
  'nehemiah': 'nehemiah',
  'esther': 'esther',
  'job': 'job',
  'psalms': 'psalms',
  'proverbs': 'proverbs',
  'ecclesiastes': 'ecclesiastes',
  'song-of-songs': 'songOfSongs',
  'isaiah': 'isaiah',
  'jeremiah': 'jeremiah',
  'lamentations': 'lamentations',
  'ezekiel': 'ezekiel',
  'daniel': 'daniel',
  'hosea': 'hosea',
  'joel': 'joel',
  'amos': 'amos',
  'obadiah': 'obadiah',
  'jonah': 'jonah',
  'micah': 'micah',
  'nahum': 'nahum',
  'habakkuk': 'habakkuk',
  'zephaniah': 'zephaniah',
  'haggai': 'haggai',
  'zechariah': 'zechariah',
  'malachi': 'malachi',
  'baruch': 'baruch',
  'tobit': 'tobit',
  'judith': 'judith',
  '1-maccabees': 'maccabees1',
  '2-maccabees': 'maccabees2',
  'wisdom': 'wisdom',
  'sirach': 'sirach',
  'matthew': 'matthew',
  'mark': 'mark',
  'luke': 'luke',
  'john': 'john',
  'acts': 'acts',
  'romans': 'romans',
  '1-corinthians': 'corinthians1',
  '2-corinthians': 'corinthians2',
  'galatians': 'galatians',
  'ephesians': 'ephesians',
  'philippians': 'philippians',
  'colossians': 'colossians',
  '1-thessalonians': 'thessalonians1',
  '2-thessalonians': 'thessalonians2',
  '1-timothy': 'timothy1',
  '2-timothy': 'timothy2',
  'titus': 'titus',
  'philemon': 'philemon',
  'hebrews': 'hebrews',
  'james': 'james',
  '1-peter': 'peter1',
  '2-peter': 'peter2',
  '1-john': 'john1',
  '2-john': 'john2',
  '3-john': 'john3',
  'jude': 'jude',
  'revelation': 'revelation',
};

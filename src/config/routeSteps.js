// '/' — точка входа, шаг 0 (не считается в прогрессе)
export const routeSteps = {
  '/': 0,
  '/uploadresume': 1,
  '/uploadvacancy': 2,
  '/generateletter': 3,
  '/resultspage': 4,
};

// куда ведёт кнопка «Назад» с каждой страницы
export const routeBackTargets = {
  '/uploadresume': '/',
  '/uploadvacancy': '/uploadresume',
  '/generateletter': '/uploadvacancy',
  '/resultspage': '/generateletter',
};

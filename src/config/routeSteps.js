export const routeSteps = {
  '/': 1,
  '/uploadresume': 2,
  '/uploadvacancy': 3,
  '/generateletter': 4,
  '/resultspage': 5,
};

// куда ведёт кнопка «Назад» с каждой страницы
export const routeBackTargets = {
  '/uploadresume': '/',
  '/uploadvacancy': '/uploadresume',
  '/generateletter': '/uploadvacancy',
  '/resultspage': '/generateletter',
};

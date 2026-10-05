
# sanctuary



## note editing

### images

- [ ] avoiding duplication of images when inserting something again something that already is there
- [ ] something like a 'stamp' catalog, where you can insert maybe small alpha sticker-like images that you may wish to insert often into your notes again and again 


## settings

- [ ] making crash logs optional – this won't be a problem anytime soon, but has to be implemented before the first functional release


# rzeka

- [ ] 
- [ ] Capture exceptions outside the river
	- Crash reporting (rzeka.Reporting) currently only captures exceptions caught by rzeka's error boundaries, i.e. failing spells in the river, we also need to cover crashes happening elsewhere: 
		- in Godot callbacks (`_Ready, _Process, signal handlers`)
			- [ ] does godot expose 
		- unhandled exceptions that terminate the process (`AppDomain.UnhandledException`)
		- unobserved async Task exceptions (`TaskScheduler.UnobservedTaskException`)